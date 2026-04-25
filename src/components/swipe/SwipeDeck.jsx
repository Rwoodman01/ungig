// SwipeDeck — stacks SwipeableCard instances and lets the top one be either
// swiped (touch / mouse drag) or dispatched via the pass / like buttons.
//
// All animation and gesture handling is local — no external swipe library is
// required, which avoids the missing-peer-dep crash we hit with
// react-tinder-card.

import { createRef, useEffect, useMemo, useState } from 'react';
import SwipeCard from './SwipeCard.jsx';
import SwipeControls from './SwipeControls.jsx';
import SwipeableCard from './SwipeableCard.jsx';
import EmptyDeckState from './EmptyDeckState.jsx';

export default function SwipeDeck({
  members = [],
  recycledMembers = [],
  userDoc,
  onDecision,
  onShowList,
}) {
  const safePrimary = Array.isArray(members) ? members : [];
  const safeRecycled = Array.isArray(recycledMembers) ? recycledMembers : [];
  const cards = safePrimary.length > 0 ? safePrimary : safeRecycled;
  const isRecycled = safePrimary.length === 0 && safeRecycled.length > 0;

  const [topIndex, setTopIndex] = useState(-1);
  const [glow, setGlow] = useState('');
  const [busy, setBusy] = useState(false);

  // Re-seed the top of the stack whenever the source data changes
  // (data finishes loading, list is filtered, or the user toggles to seen-deck).
  useEffect(() => {
    if (cards.length > 0) {
      setTopIndex(cards.length - 1);
    } else {
      setTopIndex(-1);
    }
  }, [cards.length]);

  // Stable refs so the buttons can imperatively trigger a swipe on the top card.
  const childRefs = useMemo(
    () => Array.from({ length: cards.length }, () => createRef()),
    [cards.length],
  );

  const current = topIndex >= 0 && topIndex < cards.length ? cards[topIndex] : null;

  const decide = async (member, direction, source = 'swipe') => {
    if (!member || busy) return;
    setBusy(true);
    setGlow(direction === 'right' ? 'right' : 'left');
    try {
      await onDecision?.({ targetUid: member.id, direction, source, member });
    } finally {
      window.setTimeout(() => setGlow(''), 300);
      setBusy(false);
    }
  };

  const handleSwiped = (direction, member) => {
    decide(member, direction, 'swipe');
    setTopIndex((i) => i - 1);
  };

  const handleDrag = ({ dx }) => {
    if (dx > 60) setGlow('right');
    else if (dx < -60) setGlow('left');
    else setGlow('');
  };

  const swipe = async (direction) => {
    if (!current) return;
    const ref = childRefs[topIndex]?.current;
    if (ref?.swipe) {
      ref.swipe(direction);
    } else {
      await decide(current, direction, 'button');
      setTopIndex((i) => i - 1);
    }
  };

  if (!cards.length || topIndex < 0) {
    return <EmptyDeckState onShowList={onShowList} />;
  }

  // Render the top card and the next one beneath it for depth.
  // Anything further down stays unmounted.
  const visibleStart = Math.max(0, topIndex - 1);
  const visibleCards = cards.slice(visibleStart, topIndex + 1);

  return (
    <div className="space-y-5">
      <div className="relative h-[68vh] min-h-[480px] max-h-[720px]">
        {visibleCards.map((member, offset) => {
          const absoluteIndex = visibleStart + offset;
          const isTop = absoluteIndex === topIndex;
          return (
            <div key={member.id} className="absolute inset-0">
              <SwipeableCard
                ref={isTop ? childRefs[absoluteIndex] : null}
                active={isTop}
                onSwipe={(dir) => handleSwiped(dir, member)}
                onDrag={isTop ? handleDrag : undefined}
                className="absolute inset-0 select-none"
              >
                <SwipeCard
                  member={member}
                  userDoc={userDoc}
                  glow={isTop ? glow : ''}
                  recycled={isRecycled}
                />
              </SwipeableCard>
            </div>
          );
        })}
      </div>
      <SwipeControls
        disabled={busy || !current}
        onPass={() => swipe('left')}
        onLike={() => swipe('right')}
      />
    </div>
  );
}
