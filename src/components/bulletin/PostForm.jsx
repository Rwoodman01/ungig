import { useState } from 'react';
import {
  POST_AVAILABILITY,
  POST_AVAILABILITY_LABEL,
  POST_LIMITS,
  POST_TYPE_META,
  POST_TYPES,
} from '../../lib/constants.js';

const TYPE_OPTIONS = [
  { value: POST_TYPES.OFFERING, ...POST_TYPE_META[POST_TYPES.OFFERING] },
  { value: POST_TYPES.LOOKING_FOR, ...POST_TYPE_META[POST_TYPES.LOOKING_FOR] },
  { value: POST_TYPES.COMMUNITY, ...POST_TYPE_META[POST_TYPES.COMMUNITY] },
];

const AVAILABILITY_OPTIONS = Object.values(POST_AVAILABILITY).map((value) => ({
  value,
  label: POST_AVAILABILITY_LABEL[value],
}));

const TYPE_ACCENT = {
  offering: 'border-green text-green',
  looking_for: 'border-coral text-coral',
  community: 'border-gold text-ink-secondary',
};

export default function PostForm({
  initialLocation = '',
  busy = false,
  onSubmit,
  error = '',
}) {
  const [type, setType] = useState(POST_TYPES.OFFERING);
  const [what, setWhat] = useState('');
  const [exchange, setExchange] = useState('');
  const [availability, setAvailability] = useState(POST_AVAILABILITY.FLEXIBLE);
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState(initialLocation);

  const isCommunity = type === POST_TYPES.COMMUNITY;
  const helper = POST_TYPE_META[type]?.helper ?? '';

  const submit = (e) => {
    e.preventDefault();
    if (busy) return;
    onSubmit?.({
      type,
      what,
      exchange: isCommunity ? '' : exchange,
      availability,
      details,
      location,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="card p-4 space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {TYPE_OPTIONS.map((opt) => {
            const selected = opt.value === type;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={[
                  'rounded-2xl border-2 px-3 py-2 text-xs font-bold uppercase tracking-wide',
                  selected
                    ? `${TYPE_ACCENT[opt.value]} bg-cream`
                    : 'border-border text-ink-muted bg-surface',
                ].join(' ')}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-ink-muted">{helper}</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-ink-primary">
          What
        </label>
        <input
          className="input"
          placeholder={
            type === POST_TYPES.LOOKING_FOR
              ? 'What are you looking for?'
              : type === POST_TYPES.COMMUNITY
                ? 'What is the note?'
                : 'What are you offering?'
          }
          value={what}
          maxLength={POST_LIMITS.WHAT_MAX}
          onChange={(e) => setWhat(e.target.value)}
          required
        />
        <div className="text-[11px] text-ink-muted text-right">
          {what.length}/{POST_LIMITS.WHAT_MAX}
        </div>
      </div>

      {!isCommunity ? (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-ink-primary">
            In exchange for <span className="text-ink-muted font-normal">(optional)</span>
          </label>
          <input
            className="input"
            placeholder="Open to ideas / a meal / dog walking"
            value={exchange}
            maxLength={POST_LIMITS.EXCHANGE_MAX}
            onChange={(e) => setExchange(e.target.value)}
          />
          <div className="text-[11px] text-ink-muted text-right">
            {exchange.length}/{POST_LIMITS.EXCHANGE_MAX}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-ink-primary">
          Available
        </label>
        <div className="grid grid-cols-3 gap-2">
          {AVAILABILITY_OPTIONS.map((opt) => {
            const selected = opt.value === availability;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAvailability(opt.value)}
                className={[
                  'rounded-2xl border px-3 py-2 text-xs font-semibold',
                  selected
                    ? 'border-green text-green bg-cream'
                    : 'border-border text-ink-muted bg-surface',
                ].join(' ')}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-ink-primary">
          Details <span className="text-ink-muted font-normal">(optional)</span>
        </label>
        <textarea
          className="input min-h-[120px] resize-y"
          placeholder="A few sentences. What's the story, the vibe, the timing?"
          value={details}
          maxLength={POST_LIMITS.DETAILS_MAX}
          onChange={(e) => setDetails(e.target.value)}
        />
        <div className="text-[11px] text-ink-muted text-right">
          {details.length}/{POST_LIMITS.DETAILS_MAX}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-ink-primary">
          Location
        </label>
        <input
          className="input"
          placeholder="Brooklyn, NY"
          value={location}
          maxLength={80}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
        <p className="text-[11px] text-ink-muted">
          Auto-filled from your profile. Edit only if this post is somewhere else.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-coral">{error}</p>
      ) : null}

      <button type="submit" className="btn-primary w-full" disabled={busy || !what.trim() || !location.trim()}>
        {busy ? 'Posting…' : 'Post to bulletin'}
      </button>
      <p className="text-[11px] text-ink-muted text-center">
        Posts auto-expire after {POST_LIMITS.ACTIVE_DAYS} days.
      </p>
    </form>
  );
}
