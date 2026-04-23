// Thin wrapper around Firebase Storage for user asset uploads.
// Keeping the path convention (`users/{uid}/...`) in one place so the
// storage.rules stay easy to reason about.

import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase.js';

function makePath(uid, kind, filename) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const stamp = Date.now();
  return `users/${uid}/${kind}/${stamp}-${safe}`;
}

export async function uploadUserFile(uid, kind, file) {
  const path = makePath(uid, kind, file.name || 'upload');
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file, { contentType: file.type });
  const url = await getDownloadURL(ref);
  return { url, path };
}

export async function deleteUserFile(path) {
  if (!path) return;
  try {
    await deleteObject(storageRef(storage, path));
  } catch {
    // Swallow missing-file errors; callers only care about best-effort cleanup.
  }
}
