/**
 * sync-engine.ts — orchestrates Firebase Auth + Firestore cloud sync.
 *
 * Responsibilities:
 *  1. Calls signInAnonymously on first use; Firebase persists the UID in
 *     IndexedDB so the same UID is reused across sessions on the same device.
 *  2. On first successful auth, checks for an old flat `blop/{syncKey}`
 *     document and migrates it to the new subcollection structure.
 *  3. Debounces store changes and pushes per-entity to subcollections.
 *  4. Flushes immediately when the device comes back online.
 *  5. Exposes helpers used by the Cloud Sync settings UI.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useBlopStore } from "./store";
import { isFirebaseConfigured, ensureAnonymousAuth, getCurrentUid } from "./firebase";
import {
  pushAllToCloud,
  pullOldFlatSnapshot,
  deleteOldFlatSnapshot,
  getDeviceSyncKey,
  type OldFlatSnapshot,
} from "./cloudSync";

export type CloudSyncState = "disabled" | "idle" | "syncing" | "synced" | "error";

// ── Global sync state (shared across all hook instances) ──────────────────

let _state: CloudSyncState = "disabled";
let _lastSynced: string | null = localStorage.getItem("blop-last-synced");
let _authReady = false;
const _listeners = new Set<() => void>();

function _notify() { _listeners.forEach((fn) => fn()); }

function _setState(s: CloudSyncState) { _state = s; _notify(); }

function _setLastSynced(iso: string) {
  _lastSynced = iso;
  localStorage.setItem("blop-last-synced", iso);
  _notify();
}

// ── Exported state accessors ──────────────────────────────────────────────

export function getSyncState(): CloudSyncState { return _state; }
export function getLastSynced(): string | null { return _lastSynced; }
export { getDeviceSyncKey };

/** React hook — subscribe to live sync state. */
export function useSyncState() {
  const [, tick] = useState(0);
  useEffect(() => {
    const fn = () => tick((n) => n + 1);
    _listeners.add(fn);
    return () => { _listeners.delete(fn); };
  }, []);
  return { state: _state, lastSynced: _lastSynced };
}

// ── Push implementation ───────────────────────────────────────────────────

let _doSync: () => Promise<void> = async () => {};

async function _pushNow(): Promise<void> {
  if (!isFirebaseConfigured() || !_authReady) return;
  const uid = getCurrentUid();
  if (!uid) return;

  try {
    _setState("syncing");
    const { members, groups, expenses, settlements, activity, settings } =
      useBlopStore.getState();
    await pushAllToCloud({
      uid,
      displayName: settings.userName || "Me",
      members,
      groups,
      expenses,
      settlements,
      activity,
    });
    _setLastSynced(new Date().toISOString());
    _setState("synced");
  } catch (err) {
    console.error("[blop sync]", err);
    _setState("error");
  }
}

/** Fire a manual push right now (e.g. from a "Sync now" button). */
export async function triggerManualSync(): Promise<void> {
  return _doSync();
}

// ── Old flat-snapshot migration ───────────────────────────────────────────

const MIGRATED_KEY = "blop-migrated-v2";

async function _migrateIfNeeded(uid: string): Promise<void> {
  if (localStorage.getItem(MIGRATED_KEY)) return;
  try {
    const old: OldFlatSnapshot | null = await pullOldFlatSnapshot();
    if (!old) {
      localStorage.setItem(MIGRATED_KEY, "1");
      return;
    }
    // Push old data under the new structure
    await pushAllToCloud({
      uid,
      displayName: old.settings?.userName || "Me",
      members:     old.members     ?? {},
      groups:      old.groups      ?? {},
      expenses:    old.expenses    ?? {},
      settlements: old.settlements ?? {},
      activity:    old.activity    ?? [],
    });
    await deleteOldFlatSnapshot();
    localStorage.setItem(MIGRATED_KEY, "1");
    console.info("[blop sync] Migrated flat snapshot → subcollections");
  } catch (err) {
    console.warn("[blop sync] Migration skipped:", err);
  }
}

// ── Cross-device restore (legacy sync-key flow) ───────────────────────────

/**
 * Restore store data from a given sync key (for cross-device restore).
 * Tries the old flat `blop/{key}` document.
 * Returns true if data was found and imported.
 */
export async function restoreFromKey(syncKey: string): Promise<boolean> {
  const old = await pullOldFlatSnapshot(syncKey);
  if (!old) return false;
  const store = useBlopStore.getState();
  store.importData(
    JSON.stringify({
      members:     old.members,
      groups:      old.groups,
      expenses:    old.expenses,
      settlements: old.settlements,
      activity:    old.activity,
      settings:    old.settings,
      groupMeIds:  old.groupMeIds,
      version:     2,
    })
  );
  return true;
}

// ── React hook (mounted once at App root) ─────────────────────────────────

const DELAY = 4_000;

export function useSyncEngine(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const store = useBlopStore();

  // Expose _doSync so triggerManualSync() can call it
  _doSync = _pushNow;

  // Initialise Firebase Auth on mount
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      _setState("disabled");
      return;
    }
    _setState("idle");

    ensureAnonymousAuth().then(async (user) => {
      if (!user) { _setState("error"); return; }
      _authReady = true;
      await _migrateIfNeeded(user.uid);
      _pushNow();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced push whenever store data changes
  const schedulePush = useCallback(() => {
    if (!isFirebaseConfigured() || !_authReady || !navigator.onLine) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(_pushNow, DELAY);
  }, []);

  useEffect(() => {
    schedulePush();
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    store.members,
    store.groups,
    store.expenses,
    store.settlements,
    store.activity,
    store.settings,
  ]);

  // Flush immediately when device comes back online
  useEffect(() => {
    const onOnline  = () => { setIsOnline(true);  _pushNow(); };
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return { isOnline };
}
