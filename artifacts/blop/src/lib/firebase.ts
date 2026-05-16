import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth";

const cfg = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             as string | undefined,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         as string | undefined,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          as string | undefined,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID              as string | undefined,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID      as string | undefined,
};

let _app:  FirebaseApp | null = null;
let _db:   Firestore   | null = null;
let _auth: Auth        | null = null;

export function isFirebaseConfigured(): boolean {
  return !!(cfg.apiKey && cfg.projectId);
}

function getApp(): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length ? getApps()[0] : initializeApp(cfg as Required<typeof cfg>);
  return _app;
}

/** Firestore with IndexedDB offline persistence. */
export function getFirebaseDb(): Firestore | null {
  if (!isFirebaseConfigured()) return null;
  if (_db) return _db;
  try {
    // initializeFirestore must be called before any getFirestore() call
    _db = initializeFirestore(getApp(), { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch {
    // Already initialized (e.g. HMR) — grab existing instance
    _db = getFirestore(getApp());
  }
  return _db;
}

export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured()) return null;
  if (_auth) return _auth;
  _auth = getAuth(getApp());
  return _auth;
}

/** Sign in anonymously. Firebase persists the UID in IndexedDB across sessions. */
export async function ensureAnonymousAuth(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;
  try {
    const { user } = await signInAnonymously(auth);
    return user;
  } catch (err) {
    console.error("[blop auth]", err);
    return null;
  }
}

export function getCurrentUid(): string | null {
  return getFirebaseAuth()?.currentUser?.uid ?? null;
}

/** Call once; invokes cb immediately with the current user, then on every change. */
export function onAuthReady(cb: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  if (!auth) { cb(null); return () => {}; }
  return onAuthStateChanged(auth, cb);
}
