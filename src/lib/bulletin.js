// Bulletin board data-access helpers.
//
// Posts are short-lived (≤30 days) and hyper-local: we filter by a normalized
// locationKey so two members in the same string-area see each other's notes.
// This module owns:
//   - normalizing user-entered location strings,
//   - validating + creating posts (with active-cap enforcement),
//   - deleting your own posts,
//   - expressing interest (which writes a notification + opens a trade
//     proposal),
//   - flagging posts (with one-flag-per-user enforcement via doc id).
//
// Cloud Functions handle aggregation: incrementing flagCount /
// interestCount on posts and auto-hiding at the flag threshold.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import {
  MEMBER_STATUS,
  NOTIFICATION_TYPES,
  POST_AVAILABILITY,
  POST_LIMITS,
  POST_STATUS,
  POST_TYPES,
} from './constants.js';
import { notify } from './notifications.js';
import { createDeal } from './deals.js';

const POST_TYPE_VALUES = Object.values(POST_TYPES);
const AVAILABILITY_VALUES = Object.values(POST_AVAILABILITY);

/** Lowercase, trim, collapse whitespace. Used for hyper-local matching. */
export function normalizeLocation(input = '') {
  return String(input).trim().toLowerCase().replace(/\s+/g, ' ');
}

/** True if the user is allowed to post (approved + has at least one trade). */
export function canUserPost(userDoc) {
  if (!userDoc) return false;
  const isApproved = userDoc.status === MEMBER_STATUS.APPROVED;
  const hasTrades = (userDoc.tradeCount ?? 0) >= POST_LIMITS.MIN_TRADES_TO_POST;
  return isApproved && hasTrades;
}

function trimToLimit(str, max) {
  return String(str ?? '').trim().slice(0, max);
}

function validateDraft(draft) {
  if (!POST_TYPE_VALUES.includes(draft.type)) {
    throw new Error('Pick a post type.');
  }
  if (!AVAILABILITY_VALUES.includes(draft.availability)) {
    throw new Error('Pick when this is available.');
  }
  const what = trimToLimit(draft.what, POST_LIMITS.WHAT_MAX);
  if (!what) throw new Error('Tell people what this is about.');
  const exchange = trimToLimit(draft.exchange, POST_LIMITS.EXCHANGE_MAX);
  if (draft.type !== POST_TYPES.COMMUNITY && !exchange) {
    // Exchange isn't strictly required, but nudge the author.
    // Allow empty — let community-style offerings exist.
  }
  const details = trimToLimit(draft.details, POST_LIMITS.DETAILS_MAX);
  const location = trimToLimit(draft.location, 80);
  if (!location) throw new Error('A location is required so neighbors find this.');
  return { what, exchange, details, location };
}

/** Count this user's currently-active, non-expired posts. */
export async function countActivePosts(uid) {
  const nowTs = Timestamp.now();
  const snap = await getDocs(
    query(
      collection(db, 'posts'),
      where('authorId', '==', uid),
      where('status', '==', POST_STATUS.ACTIVE),
      where('expiresAt', '>', nowTs),
      limit(POST_LIMITS.MAX_ACTIVE_POSTS_PER_USER + 1),
    ),
  );
  return snap.size;
}

/**
 * Create a new bulletin post.
 * @param {{ uid: string, userDoc: object, draft: object }} args
 * @returns {Promise<string>} new post id
 */
export async function createPost({ uid, userDoc, draft }) {
  if (!uid || !userDoc) throw new Error('Sign in to post.');
  if (!canUserPost(userDoc)) {
    throw new Error('Trade once with the community before posting.');
  }
  const fields = validateDraft(draft);
  const active = await countActivePosts(uid);
  if (active >= POST_LIMITS.MAX_ACTIVE_POSTS_PER_USER) {
    throw new Error(
      `You can have up to ${POST_LIMITS.MAX_ACTIVE_POSTS_PER_USER} active posts. Delete one first.`,
    );
  }

  const now = Date.now();
  const expiresAt = Timestamp.fromMillis(
    now + POST_LIMITS.ACTIVE_DAYS * 24 * 60 * 60 * 1000,
  );
  const ref = await addDoc(collection(db, 'posts'), {
    authorId: uid,
    authorDisplayName: userDoc.displayName ?? '',
    authorPhotoURL: userDoc.photoURL ?? '',
    authorTradeCount: userDoc.tradeCount ?? 0,
    type: draft.type,
    what: fields.what,
    exchange: fields.exchange,
    availability: draft.availability,
    details: fields.details,
    location: fields.location,
    locationKey: normalizeLocation(fields.location),
    status: POST_STATUS.ACTIVE,
    flagCount: 0,
    interestCount: 0,
    createdAt: serverTimestamp(),
    expiresAt,
  });
  return ref.id;
}

/** Hard-delete a post. Rules enforce that only the author or admin can do this. */
export async function deletePost(postId) {
  await deleteDoc(doc(db, 'posts', postId));
}

/**
 * Express interest in a post: records an interest doc (one per uid),
 * notifies the poster, then creates a trade-proposal deal between the two.
 * @returns {Promise<string>} the new dealId
 */
export async function expressInterest({ post, uid, userDoc }) {
  if (!post || !uid || !userDoc) throw new Error('Sign in to express interest.');
  if (post.authorId === uid) throw new Error("You can't reply to your own post.");

  const interestRef = doc(db, 'posts', post.id, 'interests', uid);
  const existing = await getDoc(interestRef);
  let dealId = existing.exists() ? existing.data().dealId ?? '' : '';

  if (!dealId) {
    dealId = await createDeal({
      initiatorId: uid,
      receiverId: post.authorId,
    });
  }

  await setDoc(
    interestRef,
    {
      uid,
      displayName: userDoc.displayName ?? '',
      postId: post.id,
      dealId,
      createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
    },
    { merge: true },
  );

  if (!existing.exists()) {
    await notify(post.authorId, NOTIFICATION_TYPES.POST_INTEREST, {
      otherName: userDoc.displayName ?? 'Someone',
      postId: post.id,
      postWhat: post.what ?? '',
    });
  }

  return dealId;
}

/** Flag a post as inappropriate. Cloud Function aggregates and may auto-hide. */
export async function flagPost({ postId, uid, reason = '' }) {
  if (!uid) throw new Error('Sign in to report.');
  const ref = doc(db, 'posts', postId, 'flags', uid);
  await setDoc(ref, {
    uid,
    reason: String(reason).slice(0, 280),
    createdAt: serverTimestamp(),
  });
}

/** Admin: clear flags / restore visibility. */
export async function adminApprovePost(postId) {
  await setDoc(
    doc(db, 'posts', postId),
    { status: POST_STATUS.ACTIVE, flagCount: 0, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/** Admin: hide a post from public view (does not delete). */
export async function adminRemovePost(postId) {
  await setDoc(
    doc(db, 'posts', postId),
    { status: POST_STATUS.HIDDEN, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
