import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

export default function MatchCelebrationModal({ matchName, onClose }) {
  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.65 },
      colors: ['#1B7F4F', '#E96D5A', '#E0B75A', '#F6EFE4'],
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-navyHero/95 flex items-center justify-center p-6">
      <div className="bg-cream rounded-[24px] max-w-sm w-full p-6 text-center shadow-2xl">
        <img src="/giff/face.png" alt="" className="h-24 w-24 mx-auto mb-5" />
        <h2 className="text-3xl font-display font-bold text-navyHero">It&apos;s a match!</h2>
        <p className="text-sm text-ink-secondary mt-3 leading-relaxed">
          Giff thinks you and {matchName ?? 'this member'} would trade well together.
        </p>
        <div className="mt-6 grid gap-2">
          <Link to="/matches" className="btn-primary text-center" onClick={onClose}>
            View matches
          </Link>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Keep swiping
          </button>
        </div>
      </div>
    </div>
  );
}
