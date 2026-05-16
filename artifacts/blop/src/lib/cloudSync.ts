/**
 * cloudSync.ts — all Firestore read/write logic.
 *
 * Deliberately has NO import from store.ts to avoid circular deps.
 * The sync-engine and store feed data in; callbacks carry data out.
 *
 * Firestore structure:
 *   users/{uid}
 *   groups/{groupId}
 *   groups/{groupId}/members/{memberId}
 *   groups/{groupId}/expenses/{expenseId}
 *   groups/{groupId}/settlements/{settlementId}
 *   groups/{groupId}/activity/{activityId}
 *   invites/{inviteCode}
 */

import {
  doc, setDoc, getDoc, deleteDoc,
  collection, getDocs, writeBatch,
  serverTimestamp, onSnapshot,
  query, orderBy, limit, arrayUnion,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb, getCurrentUid } from "./firebase";
import type {
  Group, Member, Expense, SettlementPayment,
  ActivityLog, SyncStatus, GroupSnapshotPayload,
} from "./models";

// ── Device sync-key (kept for backward-compat migration) ──────────────────

export const SYNC_KEY_LS = "blop-sync-key";

export function getDeviceSyncKey(): string {
  let key = localStorage.getItem(SYNC_KEY_LS);
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem(SYNC_KEY_LS, key);
  }
  return key;
}

// ── Batch writer (splits into multiple Firestore batches at 490 ops each) ──

const MAX_OPS = 490;

interface Batcher {
  set(ref: Parameters<ReturnType<typeof writeBatch>["set"]>[0], data: object, options?: { merge: boolean }): void;
  commit(): Promise<void>;
}

function makeBatcher(db: ReturnType<typeof getFirebaseDb>): Batcher {
  if (!db) throw new Error("Firebase not configured");
  const batches = [writeBatch(db)];
  let count = 0;
  return {
    set(ref, data, options) {
      if (count >= MAX_OPS) {
        batches.push(writeBatch(db!));
        count = 0;
      }
      if (options) {
        batches[batches.length - 1].set(ref, data, options);
      } else {
        batches[batches.length - 1].set(ref, data);
      }
      count++;
    },
    async commit() {
      await Promise.all(batches.map((b) => b.commit()));
    },
  };
}

// ── Push full store to proper subcollections ───────────────────────────────

export interface PushPayload {
  uid: string;
  displayName: string;
  members: Record<string, Member>;
  groups: Record<string, Group>;
  expenses: Record<string, Expense>;
  settlements: Record<string, SettlementPayment>;
  activity: ActivityLog[];
}

export async function pushAllToCloud(payload: PushPayload): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase not configured");

  const { uid, displayName, members, groups, expenses, settlements, activity } = payload;
  const bw = makeBatcher(db);

  // User profile
  bw.set(doc(db, "users", uid), {
    displayName,
    syncedAt: serverTimestamp(),
  });

  // Groups + their subcollections
  for (const group of Object.values(groups)) {
    bw.set(doc(db, "groups", group.id), {
      name:            group.name,
      type:            group.type,
      defaultCurrency: group.defaultCurrency,
      memberIds:       arrayUnion(...group.memberIds),
      ...(group.syncStatus === "local" ? { ownerUid: uid } : {}),
      memberUids:      arrayUnion(uid),
      createdBy:       group.createdBy,
      createdAt:       group.createdAt,
      updatedAt:       group.updatedAt,
      isArchived:      group.isArchived,
      inviteCode:      group.inviteCode,
    }, { merge: true });

    // Invite lookup document
    if (group.syncStatus === "local") {
      bw.set(doc(db, "invites", group.inviteCode.toUpperCase()), {
        groupId:   group.id,
        groupName: group.name,
        ownerUid:  uid,
        ownerName: displayName,
        createdAt: group.createdAt,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }, { merge: true });
    }

    // Members belonging to this group
    for (const memberId of group.memberIds) {
      const m = members[memberId];
      if (!m) continue;
      bw.set(doc(db, "groups", group.id, "members", memberId), {
        name:        m.name,
        avatarColor: m.avatarColor,
        joinedAt:    m.joinedAt,
        userId:      m.userId ?? null,
      }, { merge: true });
    }
  }

  // Expenses
  for (const e of Object.values(expenses)) {
    bw.set(doc(db, "groups", e.groupId, "expenses", e.id), {
      title:                      e.title,
      amount:                     e.amount,
      currency:                   e.currency,
      exchangeRateToGroupCurrency: e.exchangeRateToGroupCurrency,
      amountInGroupCurrency:      e.amountInGroupCurrency,
      paidByMemberId:             e.paidByMemberId,
      participants:               e.participants,
      splitType:                  e.splitType,
      category:                   e.category,
      note:                       e.note      ?? null,
      receiptUrl:                 e.receiptUrl ?? null,
      expenseDate:                e.expenseDate,
      createdAt:                  e.createdAt,
      updatedAt:                  e.updatedAt,
      createdBy:                  e.createdBy,
      updatedBy:                  e.updatedBy  ?? null,
      isDeleted:                  e.isDeleted,
    }, { merge: true });
  }

  // Settlements
  for (const s of Object.values(settlements)) {
    bw.set(doc(db, "groups", s.groupId, "settlements", s.id), {
      fromMemberId: s.fromMemberId,
      toMemberId:   s.toMemberId,
      amount:       s.amount,
      currency:     s.currency,
      note:         s.note      ?? null,
      isSettled:    s.isSettled,
      settledAt:    s.settledAt ?? null,
      createdAt:    s.createdAt,
      createdBy:    s.createdBy,
    }, { merge: true });
  }

  // Activity
  for (const a of activity) {
    bw.set(doc(db, "groups", a.groupId, "activity", a.id), {
      actionType:  a.actionType,
      entityId:    a.entityId,
      entityType:  a.entityType,
      message:     a.message,
      oldValue:    a.oldValue ?? null,
      newValue:    a.newValue ?? null,
      createdAt:   a.createdAt,
      createdBy:   a.createdBy,
    }, { merge: true });
  }

  await bw.commit();
}

// ── Invite lookup ──────────────────────────────────────────────────────────

export async function lookupInvite(
  code: string
): Promise<{ groupId: string; groupName: string; ownerName?: string; createdAt: string } | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, "invites", code.toUpperCase()));
  if (!snap.exists()) return null;
  const data = snap.data() as { groupId: string; groupName: string; ownerName?: string; createdAt: string; expiresAt?: string };
  if (data.expiresAt && new Date(data.expiresAt) < new Date()) return null;
  return {
    groupId: data.groupId,
    groupName: data.groupName,
    ownerName: data.ownerName,
    createdAt: data.createdAt
  };
}

// ── Secure group joining ───────────────────────────────────────────────────

export async function joinGroupCloud(groupId: string): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;
  const uid = getCurrentUid();
  if (!uid) return false;

  try {
    // Only update memberUids to comply with Firestore security rules
    await setDoc(doc(db, "groups", groupId), {
      memberUids: arrayUnion(uid)
    }, { merge: true });
    return true;
  } catch (err) {
    console.error("[blop sync] joinGroupCloud failed:", err);
    return false;
  }
}

// ── Pull a full group snapshot from Firestore ──────────────────────────────

export async function pullGroupFromCloud(
  groupId: string
): Promise<GroupSnapshotPayload | null> {
  const db = getFirebaseDb();
  if (!db) return null;

  const groupSnap = await getDoc(doc(db, "groups", groupId));
  if (!groupSnap.exists()) return null;

  const gd = groupSnap.data();
  const group: Group = {
    id:              groupId,
    name:            gd.name,
    type:            gd.type,
    defaultCurrency: gd.defaultCurrency,
    memberIds:       gd.memberIds ?? [],
    createdBy:       gd.createdBy,
    createdAt:       gd.createdAt,
    updatedAt:       gd.updatedAt,
    isArchived:      gd.isArchived ?? false,
    inviteCode:      gd.inviteCode,
    syncStatus:      "synced",
  };

  const [membersSnap, expensesSnap, settlementsSnap, activitySnap] =
    await Promise.all([
      getDocs(collection(db, "groups", groupId, "members")),
      getDocs(collection(db, "groups", groupId, "expenses")),
      getDocs(collection(db, "groups", groupId, "settlements")),
      getDocs(collection(db, "groups", groupId, "activity")),
    ]);

  const members: Record<string, Member> = {};
  membersSnap.forEach((d) => {
    const data = d.data();
    members[d.id] = {
      id: d.id, name: data.name,
      avatarColor: data.avatarColor, joinedAt: data.joinedAt,
    };
  });

  const expenses: Record<string, Expense> = {};
  expensesSnap.forEach((d) => {
    const data = d.data();
    expenses[d.id] = {
      id: d.id, groupId, syncStatus: "synced" as SyncStatus,
      title: data.title, amount: data.amount, currency: data.currency,
      exchangeRateToGroupCurrency: data.exchangeRateToGroupCurrency ?? 1,
      amountInGroupCurrency: data.amountInGroupCurrency ?? data.amount,
      paidByMemberId: data.paidByMemberId, participants: data.participants ?? [],
      splitType: data.splitType, category: data.category,
      note: data.note ?? undefined, receiptUrl: data.receiptUrl ?? undefined,
      expenseDate: data.expenseDate, createdAt: data.createdAt,
      updatedAt: data.updatedAt, createdBy: data.createdBy,
      updatedBy: data.updatedBy ?? undefined, isDeleted: data.isDeleted ?? false,
    };
  });

  const settlements: Record<string, SettlementPayment> = {};
  settlementsSnap.forEach((d) => {
    const data = d.data();
    settlements[d.id] = {
      id: d.id, groupId,
      fromMemberId: data.fromMemberId, toMemberId: data.toMemberId,
      amount: data.amount, currency: data.currency,
      note: data.note ?? undefined, isSettled: data.isSettled,
      settledAt: data.settledAt ?? undefined,
      createdAt: data.createdAt, createdBy: data.createdBy,
    };
  });

  const activity: ActivityLog[] = [];
  activitySnap.forEach((d) => {
    const data = d.data();
    activity.push({
      id: d.id, groupId,
      actionType: data.actionType, entityId: data.entityId,
      entityType: data.entityType, message: data.message,
      oldValue: data.oldValue ?? undefined, newValue: data.newValue ?? undefined,
      createdAt: data.createdAt, createdBy: data.createdBy,
    });
  });

  return {
    groupId,
    inviteCode: group.inviteCode,
    groupName:  group.name,
    group,
    members,
    expenses,
    settlements,
    activity,
  };
}

// ── Real-time listeners (onSnapshot) ──────────────────────────────────────

export interface GroupListeners {
  onExpenses:    (changes: Array<{ type: string; id: string; data: Expense | null }>) => void;
  onSettlements: (changes: Array<{ type: string; id: string; data: SettlementPayment | null }>) => void;
  onActivity:    (newItems: ActivityLog[]) => void;
  onMembers:     (changes: Array<{ type: string; id: string; data: Member | null }>) => void;
}

const _groupUnsubs = new Map<string, Unsubscribe[]>();

export function subscribeToGroup(groupId: string, listeners: GroupListeners): void {
  const db = getFirebaseDb();
  if (!db) return;
  if (_groupUnsubs.has(groupId)) return; // already subscribed

  const unsubs: Unsubscribe[] = [];

  // Expenses
  unsubs.push(
    onSnapshot(collection(db, "groups", groupId, "expenses"), (snap) => {
      const serverOnly = snap.docChanges().filter((c) => !c.doc.metadata.hasPendingWrites);
      if (!serverOnly.length) return;
      const changes = serverOnly.map((c) => {
        if (c.type === "removed") return { type: "removed", id: c.doc.id, data: null };
        const d = c.doc.data();
        return {
          type: c.type, id: c.doc.id,
          data: {
            id: c.doc.id, groupId, syncStatus: "synced" as SyncStatus,
            title: d.title, amount: d.amount, currency: d.currency,
            exchangeRateToGroupCurrency: d.exchangeRateToGroupCurrency ?? 1,
            amountInGroupCurrency: d.amountInGroupCurrency ?? d.amount,
            paidByMemberId: d.paidByMemberId, participants: d.participants ?? [],
            splitType: d.splitType, category: d.category,
            note: d.note ?? undefined, receiptUrl: d.receiptUrl ?? undefined,
            expenseDate: d.expenseDate, createdAt: d.createdAt,
            updatedAt: d.updatedAt, createdBy: d.createdBy,
            updatedBy: d.updatedBy ?? undefined, isDeleted: d.isDeleted ?? false,
          } as Expense,
        };
      });
      listeners.onExpenses(changes);
    }, (err) => { console.error("[blop sync] expenses:", err); })
  );

  // Settlements
  unsubs.push(
    onSnapshot(collection(db, "groups", groupId, "settlements"), (snap) => {
      const serverOnly = snap.docChanges().filter((c) => !c.doc.metadata.hasPendingWrites);
      if (!serverOnly.length) return;
      const changes = serverOnly.map((c) => {
        if (c.type === "removed") return { type: "removed", id: c.doc.id, data: null };
        const d = c.doc.data();
        return {
          type: c.type, id: c.doc.id,
          data: {
            id: c.doc.id, groupId,
            fromMemberId: d.fromMemberId, toMemberId: d.toMemberId,
            amount: d.amount, currency: d.currency,
            note: d.note ?? undefined, isSettled: d.isSettled,
            settledAt: d.settledAt ?? undefined,
            createdAt: d.createdAt, createdBy: d.createdBy,
          } as SettlementPayment,
        };
      });
      listeners.onSettlements(changes);
    }, (err) => { console.error("[blop sync] settlements:", err); })
  );

  // Activity (newest 200, append-only)
  unsubs.push(
    onSnapshot(
      query(collection(db, "groups", groupId, "activity"), orderBy("createdAt", "desc"), limit(200)),
      (snap) => {
        const added = snap
          .docChanges()
          .filter((c) => c.type === "added" && !c.doc.metadata.hasPendingWrites);
        if (!added.length) return;
        const newItems: ActivityLog[] = added.map((c) => {
          const d = c.doc.data();
          return {
            id: c.doc.id, groupId,
            actionType: d.actionType, entityId: d.entityId,
            entityType: d.entityType, message: d.message,
            oldValue: d.oldValue ?? undefined, newValue: d.newValue ?? undefined,
            createdAt: d.createdAt, createdBy: d.createdBy,
          };
        });
        listeners.onActivity(newItems);
      },
      (err) => { console.error("[blop sync] activity:", err); }
    )
  );

  // Members
  unsubs.push(
    onSnapshot(collection(db, "groups", groupId, "members"), (snap) => {
      const serverOnly = snap.docChanges().filter((c) => !c.doc.metadata.hasPendingWrites);
      if (!serverOnly.length) return;
      const changes = serverOnly.map((c) => {
        if (c.type === "removed") return { type: "removed", id: c.doc.id, data: null };
        const d = c.doc.data();
        return {
          type: c.type, id: c.doc.id,
          data: { id: c.doc.id, name: d.name, avatarColor: d.avatarColor, joinedAt: d.joinedAt } as Member,
        };
      });
      listeners.onMembers(changes);
    }, (err) => { console.error("[blop sync] members:", err); })
  );

  _groupUnsubs.set(groupId, unsubs);
}

export function unsubscribeFromGroup(groupId: string): void {
  const subs = _groupUnsubs.get(groupId);
  if (subs) { subs.forEach((u) => u()); _groupUnsubs.delete(groupId); }
}

export function unsubscribeAll(): void {
  for (const id of [..._groupUnsubs.keys()]) unsubscribeFromGroup(id);
}

// ── Old flat-snapshot helpers (migration only) ────────────────────────────

export interface OldFlatSnapshot {
  version?: number;
  members:     Record<string, Member>;
  groups:      Record<string, Group>;
  expenses:    Record<string, Expense>;
  settlements: Record<string, SettlementPayment>;
  activity:    ActivityLog[];
  settings:    { currentUserId: string; userName: string };
  groupMeIds:  Record<string, string>;
}

export async function pullOldFlatSnapshot(
  syncKey?: string
): Promise<OldFlatSnapshot | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const key  = syncKey ?? getDeviceSyncKey();
  const snap = await getDoc(doc(db, "blop", key));
  if (!snap.exists()) return null;
  return snap.data() as OldFlatSnapshot;
}

export async function deleteOldFlatSnapshot(syncKey?: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  const key = syncKey ?? getDeviceSyncKey();
  try { await deleteDoc(doc(db, "blop", key)); } catch { /* already gone */ }
}
