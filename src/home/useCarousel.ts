import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

import { useReducedMotion } from './useReducedMotion';

/** Clamps an index to `[0, slideCount - 1]` (0 when there are no slides). */
export function clampIndex(index: number, slideCount: number): number {
  return Math.max(0, Math.min(slideCount - 1, index));
}

/**
 * Effective selection from the current list of plays: the chosen play if it is still listed (even at a different
 * position than before), otherwise the first available play (list order); none if the list is empty.
 */
export function resolveActivePlay(playIds: readonly string[], chosenId: string | null): { id: string | null; index: number } {
  const position = chosenId === null ? -1 : playIds.indexOf(chosenId);
  const index = Math.max(0, position);
  return { id: playIds[index] ?? null, index };
}

export interface ArrowState {
  readonly canGoBack: boolean;
  readonly canAdvance: boolean;
}

/** Arrows stop at the edges: no wrap-around. With a single poster, no move is possible. */
export function arrowState(index: number, slideCount: number): ArrowState {
  return { canGoBack: index > 0, canAdvance: index < slideCount - 1 };
}

/**
 * Posters neighbouring the active poster, in display order (left to right), limited by the edges:
 * the first poster has no neighbour before it, the last none after it.
 */
export function neighbours(index: number, slideCount: number, reach: number): { before: number[]; after: number[] } {
  const before: number[] = [];
  const after: number[] = [];
  for (let distance = reach; distance >= 1; distance -= 1) {
    if (index - distance >= 0) {
      before.push(index - distance);
    }
  }
  for (let distance = 1; distance <= reach; distance += 1) {
    if (index + distance <= slideCount - 1) {
      after.push(index + distance);
    }
  }
  return { before, after };
}

/**
 * Poster closest to the centre given the native scroll position: each poster is centred at
 * `index × slideStepPx` (end margins let the first and last posters be centred). `slideStepPx` is the distance in px between the
 * centres of two adjacent posters: a poster's width plus the gap between posters. With no measurable step: 0.
 */
export function indexFromScroll(scroll: number, slideStepPx: number, slideCount: number): number {
  return slideStepPx <= 0 ? 0 : clampIndex(Math.round(scroll / slideStepPx), slideCount);
}

/** Index targeted by a navigation key (← → Home End), or `null` for any other key. */
export function indexAfterKey(key: string, index: number, slideCount: number): number | null {
  switch (key) {
    case 'ArrowLeft':
      return clampIndex(index - 1, slideCount);
    case 'ArrowRight':
      return clampIndex(index + 1, slideCount);
    case 'Home':
      return 0;
    case 'End':
      return Math.max(0, slideCount - 1);
    default:
      return null;
  }
}

/** Threshold, in pixels, beyond which a horizontal gesture is a swipe rather than a tap. */
export const SWIPE_THRESHOLD_PX = 48;

/** Dragging left (negative displacement) advances one poster, dragging right goes back. */
export function swipeDirection(displacement: number): -1 | 0 | 1 {
  if (Math.abs(displacement) <= SWIPE_THRESHOLD_PX) {
    return 0;
  }
  return displacement < 0 ? 1 : -1;
}

interface CarouselState {
  /** Chosen play: the index is derived from the current list, not stored. */
  readonly id: string | null;
  /** Direction of the last move, used to orient the entry animation. */
  readonly direction: 1 | -1;
}

/**
 * Poster carousel logic: one active play (identified by its `id`, the index is derived from the current list),
 * arrows, keyboard and swipe. Moves stop at the edges. `readInitialPlayId` is only read on mount. If the chosen
 * play disappears from the list, the first available play replaces it.
 */
export function useCarousel(playIds: readonly string[], readInitialPlayId: () => string | null) {
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState<CarouselState>(() => ({ id: resolveActivePlay(playIds, readInitialPlayId()).id, direction: 1 }));
  const { id: activePlayId, index } = resolveActivePlay(playIds, state.id);
  if (activePlayId !== null && activePlayId !== state.id) {
    // The chosen play is no longer in the list: the first available play becomes the selection.
    setState({ id: activePlayId, direction: 1 });
  }
  const slideCount = playIds.length;
  const swipeStart = useRef<number | null>(null);
  const hasSwipedRef = useRef(false);
  /** True right after a swipe: the click that follows must neither open nor re-centre. */
  const hasSwiped = useCallback(() => hasSwipedRef.current, []);
  /** True when the move comes from the keyboard: focus then follows the active poster. */
  const focusFollowsRef = useRef(false);
  /** True when the poster change is intentional (arrow, keyboard, thumbnail, click): native scrolling must then follow. */
  const programmaticRef = useRef(false);

  const change = useCallback(
    (target: number) => {
      const id = playIds[clampIndex(target, playIds.length)];
      if (id === undefined) {
        return;
      }
      setState((previous) =>
        previous.id === id ? previous : { id, direction: playIds.indexOf(id) > playIds.indexOf(previous.id ?? id) ? 1 : -1 },
      );
    },
    [playIds],
  );

  const goTo = useCallback(
    (target: number) => {
      if (clampIndex(target, slideCount) !== index) {
        programmaticRef.current = true;
      }
      change(target);
    },
    [change, index, slideCount],
  );

  /** Native scrolling brought another poster to the centre: the selection follows, without triggering another scroll. */
  const followScroll = change;

  /** Moves the active poster by one in the given direction (-1 previous, 1 next). */
  const moveBy = useCallback(
    (direction: -1 | 1) => {
      goTo(index + direction);
    },
    [goTo, index],
  );

  const onKey = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) {
        return;
      }
      const targetIndex = indexAfterKey(event.key, index, slideCount);
      if (targetIndex === null) {
        return;
      }
      event.preventDefault();
      // A no-op command (at an edge) must not schedule a focus transfer for the next action.
      if (targetIndex !== index) {
        focusFollowsRef.current = true;
        goTo(targetIndex);
      }
    },
    [goTo, index, slideCount],
  );

  const onPress = useCallback((event: PointerEvent<HTMLElement>) => {
    swipeStart.current = event.clientX;
    hasSwipedRef.current = false;
  }, []);

  const onRelease = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const startX = swipeStart.current;
      swipeStart.current = null;
      if (startX === null) {
        return;
      }
      const direction = swipeDirection(event.clientX - startX);
      if (direction !== 0) {
        // The click following the gesture must neither open nor re-centre.
        hasSwipedRef.current = true;
        setTimeout(() => {
          hasSwipedRef.current = false;
        }, 60);
        moveBy(direction);
      }
    },
    [moveBy],
  );

  return {
    index,
    activePlayId,
    direction: state.direction,
    reduceMotion,
    goTo,
    followScroll,
    programmaticRef,
    moveBy,
    onKey,
    onPress,
    onRelease,
    hasSwiped,
    focusFollowsRef,
    ...arrowState(index, slideCount),
  };
}
