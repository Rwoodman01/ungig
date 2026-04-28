import clsx from 'clsx';
import { getMemberCover, hasOverlap } from '../../lib/matching.js';
import GiffMatchIndicator from './GiffMatchIndicator.jsx';
import GiftedScoreBadge from '../ui/GiftedScoreBadge.jsx';

function Stars({ rating = 0 }) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="text-gold text-sm">
      {'★'.repeat(rounded)}
      <span className="text-white/40">{'★'.repeat(5 - rounded)}</span>
    </span>
  );
}

export default function SwipeCard({ member, userDoc, glow = '', recycled = false }) {
  const cover = getMemberCover(member);
  const needsMatch = hasOverlap(member.servicesNeeded, userDoc?.talentsOffered);
  const rating = member.reviewSummary?.average ?? 0;
  const giftedScore = member.giftedScore ?? 50;

  return (
    <div
      className={clsx(
        'relative h-[68vh] min-h-[480px] max-h-[720px] rounded-[20px] overflow-hidden shadow-2xl bg-navyHero border transition-shadow duration-200',
        glow === 'right' && 'shadow-[0_0_0_4px_rgba(27,127,79,0.45),0_24px_70px_rgba(27,127,79,0.35)] border-green',
        glow === 'left' && 'shadow-[0_0_0_4px_rgba(233,109,90,0.45),0_24px_70px_rgba(233,109,90,0.35)] border-coral',
        !glow && 'border-white/10',
      )}
    >
      <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-0 bg-gradient-to-t from-navyHero via-navyHero/55 to-black/10" />

      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3">
        <GiffMatchIndicator show={needsMatch} />
        <div className="flex items-center gap-2">
          <GiftedScoreBadge score={giftedScore} variant="pill" />
          {recycled ? (
            <span className="rounded-full bg-white/85 text-navyHero text-xs font-semibold px-3 py-1.5">
              Seen before
            </span>
          ) : null}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5 text-white space-y-4">
        <div>
          <h2 className="text-3xl font-display font-bold leading-tight">
            {member.displayName || 'Member'}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/80">
            {member.location ? <span>{member.location}</span> : null}
            {member.location ? <span>•</span> : null}
            <Stars rating={rating} />
            <span>•</span>
            <span>{member.tradeCount ?? 0} gifts</span>
          </div>
        </div>

        {member.talentsOffered?.length ? (
          <div>
            <div className="text-xs uppercase tracking-wide text-white/60 mb-2">Offers</div>
            <div className="flex flex-wrap gap-2">
              {member.talentsOffered.slice(0, 4).map((tag) => (
                <span key={tag} className="rounded-full bg-green/90 text-white text-xs font-semibold px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {member.servicesNeeded?.length ? (
          <div>
            <div className="text-xs uppercase tracking-wide text-white/60 mb-2">Needs</div>
            <div className="flex flex-wrap gap-2">
              {member.servicesNeeded.slice(0, 4).map((tag) => (
                <span key={tag} className="rounded-full bg-coral/90 text-white text-xs font-semibold px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
