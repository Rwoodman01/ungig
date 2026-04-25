import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { PHOTO_LIMITS, deletePhotoObject } from '../../lib/photos.js';
import PhotoGrid from './PhotoGrid.jsx';
import PhotoUploader from './PhotoUploader.jsx';

export default function PortfolioPhotoManager({ uid, photos = [], legacyProofPhotos = [], onChange }) {
  const normalized = photos.length
    ? photos
    : legacyProofPhotos.map((url) => ({ url, path: '', legacy: true }));
  const canAdd = photos.length < PHOTO_LIMITS.PORTFOLIO_MAX;

  const onUploaded = (photo) => {
    onChange?.([...photos, photo]);
  };

  const deletePhoto = async (photo) => {
    const next = photos.filter((p) => p.path !== photo.path);
    if (photo.path) await deletePhotoObject(photo.path);
    await updateDoc(doc(db, 'users', uid), {
      portfolioPhotos: next,
      updatedAt: serverTimestamp(),
    });
    onChange?.(next);
  };

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-ink-primary">Portfolio photos</h2>
        <p className="text-xs text-ink-muted mt-1">
          Add up to {PHOTO_LIMITS.PORTFOLIO_MAX} photos of your work. The first photo is your browse cover.
        </p>
      </div>
      <PhotoGrid
        photos={normalized}
        editable={photos.length > 0}
        onDelete={deletePhoto}
        coverIndex={photos.length ? 0 : -1}
        emptyText="No portfolio photos yet."
      />
      {canAdd ? (
        <PhotoUploader
          context="portfolio"
          uid={uid}
          buttonLabel="Add portfolio photo"
          onUploaded={onUploaded}
        />
      ) : (
        <p className="text-xs text-ink-muted">Portfolio is full.</p>
      )}
    </section>
  );
}
