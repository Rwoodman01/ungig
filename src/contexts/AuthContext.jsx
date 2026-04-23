// AuthContext — the single source of truth for "who is signed in" and
// "what does their Firestore user doc look like right now".
//
// We deliberately combine Firebase auth state + users/{uid} doc into one
// context so UI can render consistent gating without juggling two loads.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { auth, db, googleProvider } from '../firebase.js';
import { ADMIN_EMAILS, MEMBER_STATUS } from '../lib/constants.js';

const AuthContext = createContext(null);

function isAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase());
}

// Build the initial users/{uid} shape on first sign-in. Kept in one place so
// Firestore rules and UI stay in sync on the expected fields.
function initialUserDoc(user) {
  return {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? '',
    photoURL: user.photoURL ?? '',
    bio: '',
    location: '',
    talentsOffered: [],
    servicesNeeded: [],
    proofPhotos: [],
    status: MEMBER_STATUS.UNPAID,
    subscriptionActive: false,
    bgCheckConfirmed: false,
    bgCheckDate: null,
    profileComplete: false,
    memberSince: serverTimestamp(),
    badges: [],
    tradeCount: 0,
    connections: [],
    referredBy: null,
    role: isAdminEmail(user.email) ? 'admin' : 'member',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

async function ensureUserDoc(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, initialUserDoc(user));
  }
  return ref;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(false);

  // Subscribe to Firebase auth state. When we have a user, ensure their
  // Firestore doc exists, then subscribe to it live.
  useEffect(() => {
    let unsubDoc = null;
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      setAuthLoading(false);
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }
      if (!fbUser) {
        setUserDoc(null);
        return;
      }
      setDocLoading(true);
      try {
        const ref = await ensureUserDoc(fbUser);
        unsubDoc = onSnapshot(
          ref,
          (snap) => {
            setUserDoc(snap.exists() ? { id: snap.id, ...snap.data() } : null);
            setDocLoading(false);
          },
          (err) => {
            // eslint-disable-next-line no-console
            console.error('[Ungig] user doc listener error', err);
            setDocLoading(false);
          },
        );
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[Ungig] ensureUserDoc failed', err);
        setDocLoading(false);
      }
    });
    return () => {
      unsubAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signUpWithEmail = useCallback(async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    await ensureUserDoc(cred.user);
    return cred.user;
  }, []);

  const signInWithEmail = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }, []);

  const resetPassword = useCallback(async (email) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      user,
      userDoc,
      loading: authLoading || docLoading,
      isAdmin: userDoc?.role === 'admin' || isAdminEmail(user?.email),
      signInWithGoogle,
      signUpWithEmail,
      signInWithEmail,
      resetPassword,
      signOutUser,
    }),
    [user, userDoc, authLoading, docLoading, signInWithGoogle, signUpWithEmail, signInWithEmail, resetPassword, signOutUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Expose GoogleAuthProvider for rare cases (e.g. linking accounts later).
export { GoogleAuthProvider };
