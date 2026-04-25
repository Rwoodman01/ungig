// SwipeableCard — a tiny, dependency-free swipe wrapper that mimics the parts
// of react-tinder-card we actually use. Touch + mouse + pen via Pointer Events.
//
// Imperative API exposed via ref:
//   ref.current.swipe('left' | 'right')  → animates the card off-screen and
//                                          fires onSwipe(dir) once the
//                                          animation completes.
//
// Props:
//   onSwipe(dir)      — called when the card leaves the deck (drag or button)
//   onDrag({ dx })    — optional, called every pointer move so the parent can
//                       paint a glow on the card
//   active            — only the top card should be interactive
//   threshold         — px past which a release counts as a swipe (default 110)

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

const FLY_OUT_PX = 800; // how far off-screen we fling the card on commit
const ROTATE_DEG_PER_PX = 0.06;

const SwipeableCard = forwardRef(function SwipeableCard(
  { children, onSwipe, onDrag, active = true, threshold = 110, className = '' },
  ref,
) {
  const cardRef = useRef(null);
  const dragStateRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    pointerId: null,
  });
  const [transform, setTransform] = useState({ x: 0, y: 0, rot: 0 });
  const [animating, setAnimating] = useState(false);
  const [gone, setGone] = useState(false);

  const setStyle = useCallback((x, y, rot, withTransition) => {
    setTransform({ x, y, rot });
    setAnimating(Boolean(withTransition));
  }, []);

  const finishSwipe = useCallback(
    (direction) => {
      if (gone) return;
      setGone(true);
      const sign = direction === 'right' ? 1 : -1;
      setStyle(sign * FLY_OUT_PX, 0, sign * 25, true);
      // Fire after the CSS transition has had time to play.
      window.setTimeout(() => {
        onSwipe?.(direction);
      }, 280);
    },
    [gone, onSwipe, setStyle],
  );

  const onPointerDown = (e) => {
    if (!active || gone || animating) return;
    // Ignore right-clicks / non-primary buttons on mouse.
    if (e.button !== undefined && e.button !== 0) return;
    dragStateRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
    };
    try {
      cardRef.current?.setPointerCapture?.(e.pointerId);
    } catch {
      // setPointerCapture can throw if the pointer is already captured
      // elsewhere; safe to ignore.
    }
    setAnimating(false);
  };

  const onPointerMove = (e) => {
    const state = dragStateRef.current;
    if (!state.dragging || e.pointerId !== state.pointerId) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    setStyle(dx, dy, dx * ROTATE_DEG_PER_PX, false);
    onDrag?.({ dx, dy });
  };

  const endDrag = (e) => {
    const state = dragStateRef.current;
    if (!state.dragging) return;
    if (e && e.pointerId !== state.pointerId) return;
    dragStateRef.current = { dragging: false, startX: 0, startY: 0, pointerId: null };
    try {
      cardRef.current?.releasePointerCapture?.(state.pointerId);
    } catch {
      // ignore
    }

    const dx = transform.x;
    if (dx > threshold) {
      finishSwipe('right');
    } else if (dx < -threshold) {
      finishSwipe('left');
    } else {
      // Snap back home.
      setStyle(0, 0, 0, true);
      onDrag?.({ dx: 0, dy: 0 });
      window.setTimeout(() => setAnimating(false), 220);
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      swipe: (direction) => finishSwipe(direction === 'right' ? 'right' : 'left'),
    }),
    [finishSwipe],
  );

  // Safety net: if the card unmounts mid-drag, drop any captured pointer.
  useEffect(() => {
    return () => {
      const state = dragStateRef.current;
      if (state.dragging && state.pointerId !== null) {
        try {
          cardRef.current?.releasePointerCapture?.(state.pointerId);
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const style = {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${transform.rot}deg)`,
    transition: animating ? 'transform 250ms cubic-bezier(.2,.8,.2,1)' : 'none',
    touchAction: 'pan-y',
    willChange: 'transform',
    cursor: active ? 'grab' : 'default',
  };

  return (
    <div
      ref={cardRef}
      className={className}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {children}
    </div>
  );
});

export default SwipeableCard;
