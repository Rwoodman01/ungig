import { createRef, useMemo, useState } from 'react';
import TinderCard from 'react-tinder-card';
import SwipeCard from './SwipeCard.jsx';
import SwipeControls from './SwipeControls.jsx';
import EmptyDeckState from './EmptyDeckState.jsx';

const DIR_TO_DECISION = {
  left: 'left',
  right: 'right',
};

export default function SwipeDeck({
  members,
  recycledMembers = [],
  userDoc,
  onDecision,
  onShowList,
}) {
  const cards = members.length ? members : recycledMembers;
  const recycled = members.length === 0 && recycledMembers.length > 0;
  const [index, setIndex] = useState(cards.length - 1);
  const [glow, setGlow] = useState('');
  const [busy, setBusy] = useState(false);
  const childRefs = useMemo(
    () => Array(cards.length).fill(0).map(() => createRef()),
    [cards.length],
  );

  const current = cards[index];

  const decide = async (member, direction, source = 'swipe') => {
    if (!member || busy) return;
    setBusy(true);
    setGlow(direction === 'right' ? 'right' : 'left');
    try {
      await onDecision?.({ targetUid: member.id, direction, source, member });
    } finally {
      setTimeout(() => setGlow(''), 200);
      setBusy(false);
    }
  };

  const swiped = (dir, member, idx) => {
    const direction = DIR_TO_DECISION[dir];
    if (direction) decide(member, direction, 'swipe');
    setIndex(Math.min(idx - 1, cards.length - 1));
  };

  const swipe = async (dir) => {
    if (!current) return;
    const ref = childRefs[index]?.current;
    if (ref?.swipe) {
      await ref.swipe(dir);
    } else {
      await decide(current, DIR_TO_DECISION[dir], 'button');
      setIndex((i) => i - 1);
    }
  };

  if (!cards.length || index < 0) {
    return <EmptyDeckState onShowList={onShowList} />;
  }

  return (
    <div className="space-y-5">
      <div className="relative h-[68vh] min-h-[480px] max-h-[720px]">
        {cards.map((member, idx) => (
          <TinderCard
            ref={childRefs[idx]}
            className="absolute inset-0"
            key={member.id}
            preventSwipe={['up', 'down']}
            onSwipe={(dir) => swiped(dir, member, idx)}
          >
            <SwipeCard
              member={member}
              userDoc={userDoc}
              glow={idx === index ? glow : ''}
              recycled={recycled}
            />
          </TinderCard>
        ))}
      </div>
      <SwipeControls
        disabled={busy}
        onPass={() => swipe('left')}
        onLike={() => swipe('right')}
      />
    </div>
  );
}
