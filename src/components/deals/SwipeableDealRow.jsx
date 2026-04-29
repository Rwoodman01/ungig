import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

const REVEAL_PX = 88;
const SNAP_OPEN_PX = 44;

/**
 * Horizontal swipe (left) to reveal a delete action. Smooth transform + easing
 * aligned with card surfaces elsewhere in the app.
 */
export default function SwipeableDealRow({
  canDelete,
  to,
  onDeletePress,
  children,
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragActiveRef = useRef(false);
  const dragRef = useRef({
    startX: 0,
    startOffset: 0,
    pointerId: null,
    moved: false,
  });
  const offsetLiveRef = useRef(0);
  const rowRef = useRef(null);

  const clamp = useCallback((v) => Math.max(-REVEAL_PX, Math.min(0, v)), []);

  const snapTo = useCallback((target) => {
    const v = clamp(target);
    offsetLiveRef.current = v;
    setOffset(v);
  }, [clamp]);

  const onPointerDown = useCallback(
    (e) => {
      if (!canDelete) return;
      if (e.button !== undefined && e.button !== 0) return;
      dragActiveRef.current = true;
      setDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startOffset: offsetLiveRef.current,
        pointerId: e.pointerId,
        moved: false,
      };
      try {
        rowRef.current?.setPointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [canDelete],
  );

  const onPointerMove = useCallback(
    (e) => {
      if (!dragActiveRef.current || dragRef.current.pointerId !== e.pointerId) return;
      const dx = e.clientX - dragRef.current.startX;
      if (Math.abs(dx) > 6) dragRef.current.moved = true;
      const next = clamp(dragRef.current.startOffset + dx);
      offsetLiveRef.current = next;
      setOffset(next);
    },
    [clamp],
  );

  const endDrag = useCallback(
    (e) => {
      if (dragRef.current.pointerId !== e.pointerId) return;
      if (!dragActiveRef.current) return;
      try {
        rowRef.current?.releasePointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
      dragActiveRef.current = false;
      setDragging(false);
      dragRef.current.pointerId = null;
      const open = offsetLiveRef.current <= -SNAP_OPEN_PX;
      snapTo(open ? -REVEAL_PX : 0);
    },
    [snapTo],
  );

  const onPointerCancel = useCallback(
    (e) => {
      if (dragRef.current.pointerId !== e.pointerId) return;
      dragActiveRef.current = false;
      setDragging(false);
      dragRef.current.pointerId = null;
      snapTo(0);
    },
    [snapTo],
  );

  const onLinkClick = useCallback(
    (e) => {
      if (dragRef.current.moved) {
        e.preventDefault();
        dragRef.current.moved = false;
      }
    },
    [],
  );

  return (
    <div className="relative overflow-hidden rounded-card border border-border bg-surface shadow-card">
      {canDelete ? (
        <div className="absolute inset-y-0 right-0 flex w-[5.5rem] z-0">
          <button
            type="button"
            className="flex-1 bg-coral text-white text-sm font-semibold flex items-center justify-center active:opacity-90"
            onClick={() => onDeletePress?.()}
          >
            Delete
          </button>
        </div>
      ) : null}

      <div
        ref={rowRef}
        role="presentation"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={onPointerCancel}
        className={clsx(
          'relative z-10 bg-surface rounded-card',
          !dragging && 'transition-transform duration-200 ease-out',
        )}
        style={{ transform: `translateX(${offset}px)` }}
      >
        <Link
          to={to}
          className="block p-4"
          onClick={canDelete ? onLinkClick : undefined}
          draggable={false}
        >
          {children}
        </Link>
      </div>
    </div>
  );
}
