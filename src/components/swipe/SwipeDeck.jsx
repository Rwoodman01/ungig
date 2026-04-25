import { createRef, useEffect, useMemo, useState } from 'react';
import TinderCard from 'react-tinder-card';
import SwipeCard from './SwipeCard.jsx';
import SwipeControls from './SwipeControls.jsx';
import EmptyDeckState from './EmptyDeckState.jsx';

export default function SwipeDeck({
  members = [],
  recycledMembers = [],
  userDoc,
  onDecision,
  onShowList,
}) {
  // Ensure arrays — guard against undefined during the first loading render.
  const safePrimary = Array.isArray(members) ? members : [];
  const safeRecycled = Array.isArray(recycledMembers) ? recycledMembers : [];
  const cards = safePrimary.length > 0 ? safePrimary : safeRecycled;
  const isRecycled = safePrimary.length === 0 && safeRecycled.length > 0;

  // topIndex tracks which card is on top of the stack.
  // Initialise lazily to -1 and let the effect sync once cards arrive.
  const [topIndex, setTopIndex] = useState(-1);
  const [glow, setGlow] = useState('');
  const [busy, setBusy] = useState(false);

  // Whenever the cards array grows (data loaded) or is replaced (view toggled),
  // reset the top pointer so new cards are visible immediately.
  useEffect(() => {
    if (cards.length > 0) {
      setTopIndex(cards.length - 1);
    }
  }, [cards.length]);

  // One stable ref per card slot so react-tinder-card can call .swipe() imperatively.
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
      setTimeout(() => setGlow(''), 300);
      setBusy(false);
    }
  };

  const onCardSwiped = (dir, member) => {
    if (dir === 'left' || dir === 'right') {
      decide(member, dir, 'swipe');
    }
    setTopIndex((i) => i - 1);
  };

  const swipe = async (dir) => {
    if (!current) return;
    const ref = childRefs[topIndex]?.current;
    if (ref?.swipe) {
      await ref.swipe(dir);
    } else {
      await decide(current, dir, 'button');
      setTopIndex((i) => i - 1);
    }
  };

  // No cards loaded yet or the user has worked through the whole deck.
  if (!cards.length || topIndex < 0) {
    return <EmptyDeckState onShowList={onShowList} />;
  }

  // Only render cards that haven't been swiped away (index 0 … topIndex).
  const visibleCards = cards.slice(0, topIndex + 1);

  return (
    <div className="space-y-5">
      <div className="relative h-[68vh] min-h-[480px] max-h-[720px]">
        {visibleCards.map((member, idx) => (
          <TinderCard
            ref={childRefs[idx]}
            className="absolute inset-0 select-none"
            key={member.id}
            preventSwipe={['up', 'down']}
            onSwipe={(dir) => onCardSwiped(dir, member)}
          >
            <SwipeCard
              member={member}
              userDoc={userDoc}
              glow={idx === topIndex ? glow : ''}
              recycled={isRecycled}
            />
          </TinderCard>
        ))}
      </div>
      <SwipeControls
        disabled={busy || !current}
        onPass={() => swipe('left')}
        onLike={() => swipe('right')}
      />
    </div>
  );
}
