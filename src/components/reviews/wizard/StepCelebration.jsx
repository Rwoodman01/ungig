import { useNavigate } from 'react-router-dom';

export default function StepCelebration({ otherName }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-4">
      <img src="/giff/standing.png" alt="" className="w-40 h-auto mx-auto" />
      <h1 className="text-2xl font-display font-bold text-navyHero">You&apos;re a good human.</h1>
      <p className="text-sm text-ink-secondary max-w-sm leading-relaxed">
        Your review helps {otherName} and strengthens the whole community. That&apos;s what Gifted is about.
      </p>
      <button type="button" className="btn-primary w-full max-w-xs" onClick={() => navigate('/')}>
        Back to Home
      </button>
    </div>
  );
}
