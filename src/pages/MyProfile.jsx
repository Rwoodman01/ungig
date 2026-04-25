// "Me" tab — view your own profile, with a quick edit button that reuses
// the onboarding ProfileSetup component's state shape. For MVP we offer a
// subset of edits inline; full re-edit deep-links to a dedicated page.

import { useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Badge from '../components/ui/Badge.jsx';
import PhotoUploader from '../components/ui/PhotoUploader.jsx';
import TagInput from '../components/ui/TagInput.jsx';
import { formatDate } from '../lib/format.js';
import { LIMITS, MEMBER_STATUS } from '../lib/constants.js';

export default function MyProfile() {
  const { user, userDoc, signOutUser } = useAuth();
  const [editing, setEditing] = useState(false);

  if (!userDoc) return null;

  if (editing) {
    return <EditProfileInline userDoc={userDoc} uid={user.uid} onDone={() => setEditing(false)} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <Avatar src={userDoc.photoURL} name={userDoc.displayName} size="xl" />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display font-bold text-ink-primary truncate">
            {userDoc.displayName}
          </h1>
          {userDoc.location ? (
            <p className="text-sm text-ink-muted">{userDoc.location}</p>
          ) : null}
          <p className="text-xs text-ink-muted mt-1">
            Member since {formatDate(userDoc.memberSince)}
          </p>
          {userDoc.status === MEMBER_STATUS.PENDING ? (
            <span className="chip-gold text-[10px] mt-2">
              Awaiting culture call
            </span>
          ) : null}
          <div className="mt-2 flex gap-3 text-xs text-ink-secondary">
            <span><strong className="text-green">{userDoc.tradeCount ?? 0}</strong> gifts</span>
            <span><strong className="text-green">{userDoc.badges?.length ?? 0}</strong> badges</span>
          </div>
        </div>
      </div>

      {userDoc.bio ? (
        <p className="text-sm text-ink-secondary leading-relaxed">{userDoc.bio}</p>
      ) : null}

      {userDoc.badges?.length ? (
        <div className="flex flex-wrap gap-2">
          {userDoc.badges.map((b) => <Badge key={b} badgeKey={b} />)}
        </div>
      ) : null}

      {userDoc.talentsOffered?.length ? (
        <section>
          <h2 className="text-sm font-semibold text-ink-primary mb-2">Offers</h2>
          <div className="flex flex-wrap gap-2">
            {userDoc.talentsOffered.map((t) => <span key={t} className="chip">{t}</span>)}
          </div>
        </section>
      ) : null}

      {userDoc.servicesNeeded?.length ? (
        <section>
          <h2 className="text-sm font-semibold text-ink-primary mb-2">Needs</h2>
          <div className="flex flex-wrap gap-2">
            {userDoc.servicesNeeded.map((t) => <span key={t} className="chip">{t}</span>)}
          </div>
        </section>
      ) : null}

      <div className="space-y-2">
        <button className="btn-primary w-full" onClick={() => setEditing(true)}>
          Edit profile
        </button>
        <button className="btn-ghost w-full" onClick={signOutUser}>
          Sign out
        </button>
      </div>
    </div>
  );
}

function EditProfileInline({ userDoc, uid, onDone }) {
  const [displayName, setDisplayName] = useState(userDoc.displayName ?? '');
  const [bio, setBio] = useState(userDoc.bio ?? '');
  const [location, setLocation] = useState(userDoc.location ?? '');
  const [photoURL, setPhotoURL] = useState(userDoc.photoURL ?? '');
  const [talents, setTalents] = useState(userDoc.talentsOffered ?? []);
  const [needs, setNeeds] = useState(userDoc.servicesNeeded ?? []);
  const [proofPhotos, setProofPhotos] = useState(userDoc.proofPhotos ?? []);
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateDoc(doc(db, 'users', uid), {
        displayName: displayName.trim(),
        bio: bio.trim().slice(0, LIMITS.BIO_MAX),
        location: location.trim(),
        photoURL,
        talentsOffered: talents,
        servicesNeeded: needs,
        proofPhotos,
        updatedAt: serverTimestamp(),
      });
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <h1 className="text-xl font-display font-bold text-ink-primary">Edit profile</h1>
      <PhotoUploader
        uid={uid}
        kind="avatar"
        value={photoURL}
        onChange={setPhotoURL}
        label="Profile photo"
      />
      <div>
        <label className="text-sm font-medium text-ink-secondary mb-1 block">Name</label>
        <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium text-ink-secondary mb-1 block">
          Bio
          <span className="text-ink-muted text-xs ml-2">{bio.length}/{LIMITS.BIO_MAX}</span>
        </label>
        <textarea
          className="input min-h-[5rem]"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, LIMITS.BIO_MAX))}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-ink-secondary mb-1 block">Location</label>
        <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <TagInput value={talents} onChange={setTalents} max={LIMITS.TALENTS_MAX} label="Talents I offer" />
      <TagInput value={needs} onChange={setNeeds} max={LIMITS.SERVICES_MAX} label="Services I need" />
      <PhotoUploader
        uid={uid}
        kind="proof"
        value={proofPhotos}
        onChange={setProofPhotos}
        multi
        max={LIMITS.PROOF_PHOTOS_MAX}
        label="Proof photos"
      />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onDone} className="btn-secondary">Cancel</button>
        <button className="btn-primary" disabled={busy}>
          {busy ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
