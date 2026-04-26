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
import { ADMIN_EMAILS, MEMBER_STATUS, REVIEW_LIMITS } from '../lib/constants.js';
import { subscribeReviewQueue } from '../lib/reviewQueue.js';
import { runReviewReminders } from '../lib/reviewReminders.js';

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
    profilePhotoPath: '',
    bio: '',
    location: '',
    talentsOffered: [],
    servicesNeeded: [],
    portfolioPhotos: [],
    proofPhotos: [],
    status: MEMBER_STATUS.UNPAID,
    welcomeSeen: false,
    subscriptionActive: false,
    bgCheckConfirmed: false,
    bgCheckDate: null,
    standardsAgreed: false,
    profileComplete: false,
    memberSince: serverTimestamp(),
    badges: [],
    tradeCount: 0,
    connections: [],
    referredBy: null,
    role: isAdminEmail(user.email) ? 'admin' : 'member',
    ...(isAdminEmail(user.email) ? { showInBrowse: false } : {}),
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

function completedAtMs(item) {
  const t = item.completedAt;
  if (!t) return 0;
  return typeof t.toMillis === 'function' ? t.toMillis() : 0;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(false);
  const [reviewQueueItems, setReviewQueueItems] = useState([]);

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
        setReviewQueueItems([]);
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
            console.error('[Gifted] user doc listener error', err);
            setDocLoading(false);
          },
        );
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[Gifted] ensureUserDoc failed', err);
        setDocLoading(false);
      }
    });
    return () => {
      unsubAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) return undefined;
    return subscribeReviewQueue(user.uid, setReviewQueueItems);
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !reviewQueueItems.length) return undefined;
    const t = setTimeout(() => {
      runReviewReminders(user.uid, reviewQueueItems).catch(() => {});
    }, 2000);
    return () => clearTimeout(t);
  }, [user?.uid, reviewQueueItems]);

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

  const reviewDerived = useMemo(() => {
    const pendingReviewCount = reviewQueueItems.length;
    const maxUnreviewedMs = REVIEW_LIMITS.AUTO_CLOSE_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const unreviewedTradeCount = reviewQueueItems.filter((item) => {
      const t = completedAtMs(item);
      return t > 0 && now - t > maxUnreviewedMs;
    }).length;
    const hasPendingReviews = pendingReviewCount > 0;
    const sorted = [...reviewQueueItems].sort(
      (a, b) => completedAtMs(a) - completedAtMs(b),
    );
    const firstPendingDealId = sorted[0]?.id ?? null;
    return {
      reviewQueueItems,
      pendingReviewCount,
      unreviewedTradeCount,
      hasPendingReviews,
      firstPendingDealId,
    };
  }, [reviewQueueItems]);

  const value = useMemo(() => {
    const isAdmin = userDoc?.role === 'admin' || isAdminEmail(user?.email);
    // `canEngage` controls whether a member can create deals, message, or
    // take action on someone else's profile. Admins always can; everyone
    // else must be fully approved. Gate your engagement buttons on this.
    const canEngage = isAdmin || userDoc?.status === MEMBER_STATUS.APPROVED;
    return {
      user,
      userDoc,
      loading: authLoading || docLoading,
      isAdmin,
      canEngage,
      ...reviewDerived,
      signInWithGoogle,
      signUpWithEmail,
      signInWithEmail,
      resetPassword,
      signOutUser,
    };
  }, [user, userDoc, authLoading, docLoading, reviewDerived, signInWithGoogle, signUpWithEmail, signInWithEmail, resetPassword, signOutUser]);

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
