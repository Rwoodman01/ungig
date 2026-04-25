import { useState } from 'react';

// Mobile-friendly tag chip input. Enter/comma commits; tap chip to remove.
// Enforces a simple lowercase-trim normalization so filters stay predictable.
export default function TagInput({
  value = [],
  onChange,
  max = 3,
  placeholder = 'Add a tag and press Enter',
  label,
  hint,
}) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const t = draft.trim().toLowerCase();
    if (!t) return;
    if (value.includes(t)) {
      setDraft('');
      return;
    }
    if (value.length >= max) return;
    onChange([...value, t]);
    setDraft('');
  };

  const remove = (t) => onChange(value.filter((v) => v !== t));

  return (
    <div>
      {label ? (
        <label className="text-sm font-medium text-ink-secondary mb-1 block">
          {label}
          <span className="text-ink-muted text-xs ml-2">
            {value.length}/{max}
          </span>
        </label>
      ) : null}
      <div className="card p-3 flex flex-wrap gap-2">
        {value.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => remove(t)}
            className="chip-accent hover:opacity-80"
            aria-label={`Remove ${t}`}
          >
            {t}
            <span aria-hidden>×</span>
          </button>
        ))}
        {value.length < max ? (
          <input
            className="flex-1 min-w-[8rem] bg-transparent outline-none text-ink-primary placeholder:text-ink-muted"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                commit();
              } else if (e.key === 'Backspace' && !draft && value.length) {
                remove(value[value.length - 1]);
              }
            }}
            onBlur={commit}
            placeholder={placeholder}
          />
        ) : null}
      </div>
      {hint ? <p className="text-xs text-ink-muted mt-1">{hint}</p> : null}
    </div>
  );
}
