// Onboarding step 3: complete profile.
// Collects the minimum fields the directory and deal flows rely on.
// After save, StatusGate drops the user straight into the app (read-only
// until approved). No more "pending approval" wall.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import TagInput from '../../components/ui/TagInput.jsx';
import ProfilePhotoUploader from '../../components/photos/ProfilePhotoUploader.jsx';
import PortfolioPhotoManager from '../../components/photos/PortfolioPhotoManager.jsx';
import ProgressBar from '../../components/onboarding/ProgressBar.jsx';
import { LIMITS } from '../../lib/constants.js';
import AuthFooter from '../../components/brand/AuthFooter.jsx';

export default function ProfileSetup() {
  const { user, userDoc } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(userDoc?.displayName ?? '');
  const [bio, setBio] = useState(userDoc?.bio ?? '');
  const [location, setLocation] = useState(userDoc?.location ?? '');
  const [photoURL, setPhotoURL] = useState(userDoc?.photoURL ?? '');
  const [profilePhotoPath, setProfilePhotoPath] = useState(userDoc?.profilePhotoPath ?? '');
  const [portfolioPhotos, setPortfolioPhotos] = useState(userDoc?.portfolioPhotos ?? []);
  const [talents, setTalents] = useState(userDoc?.talentsOffered ?? []);
  const [needs, setNeeds] = useState(userDoc?.servicesNeeded ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const canSubmit =
    displayName.trim().length >= 2 &&
    bio.trim().length > 0 &&
    talents.length >= 1 &&
    needs.length >= 1;

  const save = async (e) => {
    e.preventDefault();
    if (!user || !canSubmit) return;
    setBusy(true);
    setError('');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        bio: bio.trim().slice(0, LIMITS.BIO_MAX),
        location: location.trim(),
        photoURL,
        profilePhotoPath,
        portfolioPhotos,
        talentsOffered: talents,
        servicesNeeded: needs,
        profileComplete: true,
        updatedAt: serverTimestamp(),
      });
      // Drop them straight into the app — no interruption screen.
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message ?? 'Could not save profile.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      <ProgressBar currentStep="profile" />
      <div className="screen px-6 py-4">
        <h1 className="text-2xl font-display font-bold text-ink-primary">
          Set up your profile
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          This is how other members will discover and trust you.
        </p>

      <form onSubmit={save} className="mt-6 space-y-6">
        <ProfilePhotoUploader
          uid={user.uid}
          photoURL={photoURL}
          displayName={displayName}
          onUploaded={({ url, path }) => {
            setPhotoURL(url);
            setProfilePhotoPath(path);
          }}
        />

        <div>
          <label className="text-sm font-medium text-ink-secondary mb-1 block">
            Display name
          </label>
          <input
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink-secondary mb-1 block">
            Short bio
            <span className="text-ink-muted text-xs ml-2">
              {bio.length}/{LIMITS.BIO_MAX}
            </span>
          </label>
          <textarea
            className="input min-h-[5rem]"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, LIMITS.BIO_MAX))}
            placeholder="A sentence or two about you."
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink-secondary mb-1 block">
            Location
          </label>
          <input
            className="input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, neighborhood, or region"
          />
        </div>

        <TagInput
          value={talents}
          onChange={setTalents}
          max={LIMITS.TALENTS_MAX}
          label="Talents I offer"
          placeholder="e.g. photography"
          hint="Pick 1-3 things you can trade."
        />

        <TagInput
          value={needs}
          onChange={setNeeds}
          max={LIMITS.SERVICES_MAX}
          label="Services I need"
          placeholder="e.g. resume help"
          hint="Pick 1-3 things you'd like in return."
        />

        <PortfolioPhotoManager
          uid={user.uid}
          photos={portfolioPhotos}
          legacyProofPhotos={userDoc?.proofPhotos ?? []}
          onChange={setPortfolioPhotos}
        />

        {error ? <p className="text-red-400 text-sm">{error}</p> : null}

        <button className="btn-primary w-full" disabled={!canSubmit || busy}>
          {busy ? 'Saving...' : 'Save my profile'}
        </button>
      </form>

      <AuthFooter className="mt-10 pb-4" />
      </div>
    </div>
  );
}
