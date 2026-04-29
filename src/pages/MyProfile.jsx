// "Me" tab — view your own profile, with a quick edit button that reuses
// the onboarding ProfileSetup component's state shape. For MVP we offer a
// subset of edits inline; full re-edit deep-links to a dedicated page.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  deleteField,
  doc,
  GeoPoint,
  getDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Badge from '../components/ui/Badge.jsx';
import GiftedScoreDisplay from '../components/ui/GiftedScoreDisplay.jsx';
import TagInput from '../components/ui/TagInput.jsx';
import PhotoGrid from '../components/photos/PhotoGrid.jsx';
import ProfilePhotoUploader from '../components/photos/ProfilePhotoUploader.jsx';
import PortfolioPhotoManager from '../components/photos/PortfolioPhotoManager.jsx';
import GiftedScoreBreakdown from '../components/profile/GiftedScoreBreakdown.jsx';
import LocationPlacesField from '../components/geo/LocationPlacesField.jsx';
import MaxDistanceSlider from '../components/profile/MaxDistanceSlider.jsx';
import { formatDate } from '../lib/format.js';
import { LIMITS, MEMBER_STATUS } from '../lib/constants.js';
import { MAX_DISTANCE_MILES_OPTIONS, DEFAULT_MAX_DISTANCE_MILES } from '../lib/constantsGeo.js';
import { getLocationDisplayName, initialLocationFromUserDoc } from '../lib/geo.js';
import { useBlockMuteLists } from '../hooks/useBlockMuteLists.js';
import { unblockMember, unmuteMember } from '../lib/blockMute.js';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

function maxDistanceLabel(userDoc) {
  if (!userDoc || !Object.prototype.hasOwnProperty.call(userDoc, 'maxDistanceMiles')) {
    return '25 miles';
  }
  if (userDoc.maxDistanceMiles === null) return 'Anywhere';
  const n = Number(userDoc.maxDistanceMiles);
  const opt = MAX_DISTANCE_MILES_OPTIONS.find((o) => o.miles === n);
  return opt?.label ?? `${n} miles`;
}

export default function MyProfile() {
  const { user, userDoc, signOutUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const { blockedByMeIds, mutedIds } = useBlockMuteLists(user?.uid);
  const blockedArr = useMemo(() => [...blockedByMeIds], [blockedByMeIds]);
  const mutedArr = useMemo(() => [...mutedIds], [mutedIds]);
  const [memberLabels, setMemberLabels] = useState({});

  const locName = useMemo(() => getLocationDisplayName(userDoc), [userDoc]);

  useEffect(() => {
    const ids = [...new Set([...blockedArr, ...mutedArr])];
    if (!ids.length) return undefined;
    let cancelled = false;
    (async () => {
      const next = {};
      for (const id of ids) {
        try {
          const s = await getDoc(doc(db, 'users', id));
          next[id] = s.exists() ? (s.data()?.displayName ?? 'Member') : 'Member';
        } catch {
          next[id] = 'Member';
        }
      }
      if (!cancelled) {
        setMemberLabels((prev) => ({ ...prev, ...next }));
      }
    })();
    return () => { cancelled = true; };
  }, [blockedArr, mutedArr]);

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
          {locName ? (
            <p className="text-sm text-ink-muted">{locName}</p>
          ) : null}
          <p className="text-xs text-ink-muted mt-1">
            Match within <strong className="text-ink-primary">{maxDistanceLabel(userDoc)}</strong>
          </p>
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
        <GiftedScoreDisplay score={userDoc.giftedScore ?? 50} />
      </div>

      <GiftedScoreBreakdown uid={user.uid} publicScore={userDoc.giftedScore ?? 50} />

      {(blockedArr.length > 0 || mutedArr.length > 0) ? (
        <section className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold text-ink-primary">Blocked &amp; muted</h2>
          {blockedArr.length > 0 ? (
            <div>
              <h3 className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
                Blocked members
              </h3>
              <ul className="space-y-2">
                {blockedArr.map((id) => (
                  <li key={id} className="flex items-center justify-between gap-2 text-sm">
                    <Link to={`/members/${id}`} className="text-ink-primary truncate font-medium">
                      {memberLabels[id] ?? '…'}
                    </Link>
                    <button
                      type="button"
                      className="btn-ghost text-xs shrink-0"
                      onClick={() => unblockMember({ blockerUid: user.uid, blockedUid: id })}
                    >
                      Unblock
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {mutedArr.length > 0 ? (
            <div>
              <h3 className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
                Muted (no DM notifications from them)
              </h3>
              <ul className="space-y-2">
                {mutedArr.map((id) => (
                  <li key={id} className="flex items-center justify-between gap-2 text-sm">
                    <Link to={`/members/${id}`} className="text-ink-primary truncate font-medium">
                      {memberLabels[id] ?? '…'}
                    </Link>
                    <button
                      type="button"
                      className="btn-ghost text-xs shrink-0"
                      onClick={() => unmuteMember({ uid: user.uid, mutedUid: id })}
                    >
                      Unmute
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

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

      {(userDoc.portfolioPhotos?.length || userDoc.proofPhotos?.length) ? (
        <section>
          <h2 className="text-sm font-semibold text-ink-primary mb-2">Portfolio</h2>
          <PhotoGrid
            photos={userDoc.portfolioPhotos?.length
              ? userDoc.portfolioPhotos
              : (userDoc.proofPhotos ?? []).map((url) => ({ url }))}
            coverIndex={userDoc.portfolioPhotos?.length ? 0 : -1}
          />
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
  const [location, setLocation] = useState(() => initialLocationFromUserDoc(userDoc));
  const [maxDistanceMiles, setMaxDistanceMiles] = useState(() => {
    if (userDoc && Object.prototype.hasOwnProperty.call(userDoc, 'maxDistanceMiles')) {
      return userDoc.maxDistanceMiles;
    }
    return DEFAULT_MAX_DISTANCE_MILES;
  });
  const [photoURL, setPhotoURL] = useState(userDoc.photoURL ?? '');
  const [profilePhotoPath, setProfilePhotoPath] = useState(userDoc.profilePhotoPath ?? '');
  const [portfolioPhotos, setPortfolioPhotos] = useState(userDoc.portfolioPhotos ?? []);
  const [talents, setTalents] = useState(userDoc.talentsOffered ?? []);
  const [needs, setNeeds] = useState(userDoc.servicesNeeded ?? []);
  const [busy, setBusy] = useState(false);

  const locationOk = useMemo(() => {
    if (!location.name?.trim()) return false;
    if (MAPS_KEY) {
      return location.lat != null && location.lng != null
        && Number.isFinite(location.lat) && Number.isFinite(location.lng);
    }
    return true;
  }, [location]);

  const save = async (e) => {
    e.preventDefault();
    if (!locationOk) return;
    setBusy(true);
    try {
      const name = location.name.trim();
      const lat = location.lat;
      const lng = location.lng;
      const patch = {
        displayName: displayName.trim(),
        bio: bio.trim().slice(0, LIMITS.BIO_MAX),
        location: { name, lat, lng },
        maxDistanceMiles: maxDistanceMiles === null ? null : Number(maxDistanceMiles),
        photoURL,
        profilePhotoPath,
        portfolioPhotos,
        talentsOffered: talents,
        servicesNeeded: needs,
        updatedAt: serverTimestamp(),
      };
      if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
        patch.coordinates = new GeoPoint(lat, lng);
      } else {
        patch.coordinates = deleteField();
      }
      await updateDoc(doc(db, 'users', uid), patch);
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <h1 className="text-xl font-display font-bold text-ink-primary">Edit profile</h1>
      <ProfilePhotoUploader
        uid={uid}
        photoURL={photoURL}
        displayName={displayName}
        onUploaded={({ url, path }) => {
          setPhotoURL(url);
          setProfilePhotoPath(path);
        }}
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
      <LocationPlacesField
        id="edit-profile-location"
        value={location}
        onChange={setLocation}
        disabled={busy}
      />
      <MaxDistanceSlider
        value={maxDistanceMiles}
        onChange={setMaxDistanceMiles}
        disabled={busy}
      />
      <TagInput value={talents} onChange={setTalents} max={LIMITS.TALENTS_MAX} label="Talents I offer" />
      <TagInput value={needs} onChange={setNeeds} max={LIMITS.SERVICES_MAX} label="Services I need" />
      <PortfolioPhotoManager
        uid={uid}
        photos={portfolioPhotos}
        legacyProofPhotos={userDoc.proofPhotos ?? []}
        onChange={setPortfolioPhotos}
      />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onDone} className="btn-secondary">Cancel</button>
        <button className="btn-primary" disabled={busy || !locationOk}>
          {busy ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
