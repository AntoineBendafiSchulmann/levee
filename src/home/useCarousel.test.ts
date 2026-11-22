import { describe, expect, it } from 'vitest';

import { clampIndex, arrowState, indexAfterKey, indexFromScroll, resolveActivePlay, swipeDirection, SWIPE_THRESHOLD_PX, neighbours } from './useCarousel';

describe('carousel arrow state (stops at the edges)', () => {
  it('first poster: « précédente » inactive, « suivante » active', () => {
    expect(arrowState(0, 7)).toEqual({ canGoBack: false, canAdvance: true });
  });

  it('in between: both active', () => {
    expect(arrowState(3, 7)).toEqual({ canGoBack: true, canAdvance: true });
  });

  it('last poster: « suivante » inactive, « précédente » active', () => {
    expect(arrowState(6, 7)).toEqual({ canGoBack: true, canAdvance: false });
  });

  it('a single poster, or none: both inactive', () => {
    expect(arrowState(0, 1)).toEqual({ canGoBack: false, canAdvance: false });
    expect(arrowState(0, 0)).toEqual({ canGoBack: false, canAdvance: false });
  });
});

describe('posters neighbouring the active poster', () => {
  it('in the middle: two on each side, left to right', () => {
    expect(neighbours(3, 7, 2)).toEqual({ before: [1, 2], after: [4, 5] });
  });

  it('first poster: no neighbour before it', () => {
    expect(neighbours(0, 7, 2)).toEqual({ before: [], after: [1, 2] });
  });

  it('second-to-last and last poster: neighbours stop at the edge, without wrapping around', () => {
    expect(neighbours(5, 7, 2)).toEqual({ before: [3, 4], after: [6] });
    expect(neighbours(6, 7, 2)).toEqual({ before: [4, 5], after: [] });
  });

  it('reach 1: at most one neighbour on each side', () => {
    expect(neighbours(1, 7, 1)).toEqual({ before: [0], after: [2] });
  });
});

describe('keyboard and touch navigation', () => {
  it('← and → stop at the edges, Home and End go to the extremes', () => {
    expect(indexAfterKey('ArrowRight', 2, 7)).toBe(3);
    expect(indexAfterKey('ArrowLeft', 0, 7)).toBe(0);
    expect(indexAfterKey('ArrowRight', 6, 7)).toBe(6);
    expect(indexAfterKey('Home', 4, 7)).toBe(0);
    expect(indexAfterKey('End', 4, 7)).toBe(6);
  });

  it('any other key moves nothing (Tab, Enter, Escape)', () => {
    for (const key of ['Tab', 'Enter', ' ', 'Escape', 'a']) {
      expect(indexAfterKey(key, 2, 7)).toBeNull();
    }
  });

  it('a move beyond the threshold is a swipe: left advances, right goes back', () => {
    expect(swipeDirection(-(SWIPE_THRESHOLD_PX + 1))).toBe(1);
    expect(swipeDirection(SWIPE_THRESHOLD_PX + 1)).toBe(-1);
  });

  it('a short move (tap) is not a swipe', () => {
    expect(swipeDirection(0)).toBe(0);
    expect(swipeDirection(SWIPE_THRESHOLD_PX)).toBe(0);
    expect(swipeDirection(-SWIPE_THRESHOLD_PX)).toBe(0);
  });

  it('clamping keeps an index within the list', () => {
    expect(clampIndex(-3, 7)).toBe(0);
    expect(clampIndex(12, 7)).toBe(6);
    expect(clampIndex(2, 0)).toBe(0);
  });
});

describe('selection tracked from native scrolling (under 1100 px)', () => {
  // Step of 208 px: a 190 px poster plus an 18 px gap; poster i is centred at i × step.
  it('each centred poster gives its index', () => {
    for (let i = 0; i < 7; i += 1) {
      expect(indexFromScroll(i * 208, 208, 7)).toBe(i);
    }
  });

  it('during the gesture, the selection changes at half a step', () => {
    expect(indexFromScroll(103, 208, 7)).toBe(0);
    expect(indexFromScroll(105, 208, 7)).toBe(1);
    expect(indexFromScroll(94, 208, 7)).toBe(0);
  });

  it('an elastic or out-of-bounds scroll stays within the list', () => {
    expect(indexFromScroll(-40, 208, 7)).toBe(0);
    expect(indexFromScroll(5000, 208, 7)).toBe(6);
  });

  it('no measurable step (single poster, layout absent): first poster', () => {
    expect(indexFromScroll(120, 0, 7)).toBe(0);
    expect(indexFromScroll(120, -1, 7)).toBe(0);
  });
});

describe('selection tracked by play identifier', () => {
  const before = ['misanthrope', 'vasseur', 'jeu', 'avare', 'cyrano', 'cle', 'huis-clos'];
  const sunday = ['misanthrope', 'jeu', 'avare', 'cyrano'];

  it('the chosen play stays active when it changes position in the list (Jeu: 3rd → 2nd)', () => {
    expect(resolveActivePlay(before, 'jeu')).toEqual({ id: 'jeu', index: 2 });
    // With the old index (2), Sunday's list would have given « avare »: that is the regression to catch.
    expect(resolveActivePlay(sunday, 'jeu')).toEqual({ id: 'jeu', index: 1 });
    expect(resolveActivePlay(sunday, 'jeu').id).not.toBe(sunday[2]);
  });

  it('a play that disappears from the list is replaced by the first available play', () => {
    expect(resolveActivePlay(sunday, 'cle')).toEqual({ id: 'misanthrope', index: 0 });
    expect(resolveActivePlay(sunday, 'huis-clos')).toEqual({ id: 'misanthrope', index: 0 });
  });

  it('with no prior choice, first play in the list', () => {
    expect(resolveActivePlay(before, null)).toEqual({ id: 'misanthrope', index: 0 });
  });

  it('empty list: no active play (home empty state)', () => {
    expect(resolveActivePlay([], 'jeu')).toEqual({ id: null, index: 0 });
    expect(resolveActivePlay([], null)).toEqual({ id: null, index: 0 });
  });
});
