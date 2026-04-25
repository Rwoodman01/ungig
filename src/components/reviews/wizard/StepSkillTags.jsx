import clsx from 'clsx';
import { REVIEW_LIMITS, SKILL_TAGS } from '../../../lib/constants.js';

export default function StepSkillTags({
  otherName,
  skillTags,
  onToggle,
  onNext,
  onBack,
  disabled,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold text-navyHero leading-tight">
          What did {otherName} do well?
        </h1>
        <p className="text-sm text-ink-muted mt-2">Choose up to 3 — optional but appreciated</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {SKILL_TAGS.map((tag) => {
          const selected = skillTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onToggle(tag)}
              className={clsx(
                'rounded-full px-3 py-2 text-sm font-medium border transition-colors',
                selected
                  ? 'border-green bg-green text-white'
                  : 'border-border bg-surface text-ink-secondary hover:border-green/40',
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={onBack}>
          Back
        </button>
        <button type="button" className="btn-primary flex-1" onClick={onNext} disabled={disabled}>
          {skillTags.length ? `Continue (${skillTags.length}/${REVIEW_LIMITS.SKILL_TAGS_MAX})` : 'Skip'}
        </button>
      </div>
    </div>
  );
}
