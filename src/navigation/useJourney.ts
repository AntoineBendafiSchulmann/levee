import { useCallback, useEffect, useRef, useState } from 'react';

import type { PlayPageTarget } from '../domain/performances';
import type { OutingCriteria } from '../domain/types';
import { writeCriteria, readCriteria, tabStorage, type CriteriaConstraints } from './criteriaSessionStorage';
import { parseRoute, anchorFromUrl, pathForTarget, pathForScreen, defaultSource, type Screen, type PlayPageSource, type Route } from './routes';

export type { Screen, PlayPageSource } from './routes';
/** Vertical scroll position remembered per page. */
export type ScrollKey = 'home' | 'results';

/**
 * What the app stores in `history.state` when it opens a play page: where the user came from and the key of the
 * element that must regain focus on the way back. A missing or differently shaped state (direct opening, reload of
 * an address without state) gives the default source and no focus to restore.
 */
interface HistoryState {
  readonly source: PlayPageSource;
  readonly focusKey: string | null;
}

/*
 * Persisted shape of `history.state`: `{ levee: true, origine: 'accueil' | 'resultats', cleOrigine }`. It does not
 * change with the names used in the code, so that entries already in a tab's history keep working: these two
 * functions are the only place that knows the persisted names and values.
 */
const STORED_SOURCE: Readonly<Record<PlayPageSource, 'accueil' | 'resultats'>> = { home: 'accueil', results: 'resultats' };

function encodeHistoryState(state: HistoryState): unknown {
  return { levee: true, origine: STORED_SOURCE[state.source], cleOrigine: state.focusKey };
}

function readHistoryState(): HistoryState | null {
  const stored: unknown = window.history.state;
  if (typeof stored !== 'object' || stored === null) {
    return null;
  }
  const { levee, origine, cleOrigine } = stored as Record<string, unknown>;
  const source = (Object.keys(STORED_SOURCE) as PlayPageSource[]).find((key) => STORED_SOURCE[key] === origine);
  if (levee !== true || source === undefined) {
    return null;
  }
  return { source, focusKey: typeof cleOrigine === 'string' ? cleOrigine : null };
}

interface Navigation {
  readonly path: string;
  /** Where the displayed play page was opened from, and the key of the element to refocus on return (`null` outside a play page). */
  readonly playPageReturnContext: { readonly source: PlayPageSource; readonly focusKey: string | null } | null;
  /** Key of the element that regains focus after returning from a play page (`null` when there is nothing to restore). */
  readonly returnFocusKey: string | null;
}

function navigationFromLocation(previous: Navigation | null): Navigation {
  const path = window.location.pathname;
  const route = parseRoute(path);
  const state = readHistoryState();
  const playPageReturnContext =
    route.screen === 'play'
      ? { source: state?.source ?? defaultSource(route), focusKey: state?.focusKey ?? null }
      : null;
  const before = previous?.playPageReturnContext ?? null;
  const returnFocusKey = route.screen !== 'play' && before?.source === route.screen ? before.focusKey : null;
  return { path, playPageReturnContext, returnFocusKey };
}

/**
 * Navigation state of the home → criteria → results → detail journey: displayed screen, in-memory criteria
 * (applied live), open criteria sheet, scroll positions to restore on return.
 * The screen is reflected in the address (`/`, `/seances`, `/piece/:id`, `/seances/:id`) so that the browser's
 * back button, direct opening and reloading work. The criteria are not in the address: they are kept in the
 * tab's `sessionStorage` (a refresh keeps them), and a direct opening in a fresh tab uses the initial criteria.
 * The displayed performance, however, always comes from the address.
 */
export function useJourney(initialCriteria: OutingCriteria, constraints: CriteriaConstraints) {
  // The tab's criteria survive a refresh (sessionStorage); a fresh tab, or storage that is missing,
  // unreadable or rejected by the domain, gives the initial criteria.
  const [criteria, setCriteria] = useState(() => readCriteria(tabStorage(), constraints) ?? initialCriteria);

  useEffect(() => {
    writeCriteria(tabStorage(), criteria);
  }, [criteria]);

  const [navigation, setNavigation] = useState<Navigation>(() => navigationFromLocation(null));
  const [criteriaSheetOpen, setCriteriaSheetOpen] = useState(false);
  /** True after the user's first navigation: the destination page then moves focus there. */
  const [hasNavigated, setHasNavigated] = useState(false);
  const anchor = useRef<'evening-performances' | null>(anchorFromUrl(window.location.pathname, window.location.hash));
  /** Play featured on the home page, remembered by its identifier: it follows the play, not its position in the list. */
  const activePlay = useRef<string | null>(null);
  const positions = useRef<Record<ScrollKey, number>>({ home: 0, results: 0 });

  const route: Route = parseRoute(navigation.path);

  const syncFromLocation = useCallback(() => {
    setNavigation((previous) => navigationFromLocation(previous));
    setCriteriaSheetOpen(false);
    setHasNavigated(true);
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', syncFromLocation);
    return () => {
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, [syncFromLocation]);

  const go = useCallback(
    (target: Exclude<Screen, 'play'>) => {
      if (window.location.pathname !== pathForScreen(target)) {
        window.history.pushState(null, '', pathForScreen(target));
      }
      syncFromLocation();
    },
    [syncFromLocation],
  );

  /** Opens a detail page; `focusKey` designates the element (card, poster) that will regain focus on return. */
  const openPlay = useCallback(
    (target: PlayPageTarget, source: PlayPageSource, focusKey: string) => {
      window.history.pushState(encodeHistoryState({ source, focusKey }), '', pathForTarget(target));
      syncFromLocation();
    },
    [syncFromLocation],
  );

  /**
   * Explicit choice of a showtime on the detail page: the address becomes that of this performance, without a
   * new history entry, so that a reload shows the same performance and « retour » leaves the detail page.
   */
  const selectPerformance = useCallback((id: string) => {
    const path = pathForTarget({ type: 'performance', id });
    if (window.location.pathname === path) {
      return;
    }
    const state: unknown = window.history.state;
    window.history.replaceState(state, '', path);
    setNavigation((previous) => ({ ...previous, path }));
  }, []);

  /**
   * Return from the detail page. When the user arrived through the app, go back to the previous history entry
   * (same effect as the browser's back button: criteria, scroll and focus restored). When arrived at directly,
   * there is nothing before: go to the source screen.
   */
  const returnFromPlayPage = useCallback(() => {
    if (readHistoryState() !== null) {
      window.history.back();
    } else {
      go(defaultSource(parseRoute(window.location.pathname)));
    }
  }, [go]);

  const updateCriteria = useCallback((change: Partial<OutingCriteria>) => {
    setCriteria((previousCriteria) => ({ ...previousCriteria, ...change }));
  }, []);

  const openCriteriaSheet = useCallback(() => {
    setCriteriaSheetOpen(true);
  }, []);
  const closeCriteriaSheet = useCallback(() => {
    setCriteriaSheetOpen(false);
  }, []);
  const goToResults = useCallback(() => {
    go('results');
  }, [go]);
  const returnToHome = useCallback(() => {
    // From another page: the home page opens at the top (going back, however, restores the position).
    positions.current.home = 0;
    go('home');
  }, [go]);
  /** « Séances de la soirée » from another page: the home page opens on the evening performances. */
  const goToEveningPerformances = useCallback(() => {
    anchor.current = 'evening-performances';
    go('home');
  }, [go]);
  /** Reads the anchor requested by the navigation once, then forgets it. */
  const consumeAnchor = useCallback((): 'evening-performances' | null => {
    const requested = anchor.current;
    anchor.current = null;
    return requested;
  }, []);

  const readActivePlay = useCallback(() => activePlay.current, []);
  const rememberActivePlay = useCallback((id: string) => {
    activePlay.current = id;
  }, []);

  const readScrollPosition = useCallback((key: ScrollKey) => positions.current[key], []);
  const rememberScrollPosition = useCallback((key: ScrollKey, value: number) => {
    positions.current[key] = value;
  }, []);

  return {
    screen: route.screen,
    playPageTarget: route.target,
    playPageSource: navigation.playPageReturnContext?.source ?? null,
    returnFocusKey: navigation.returnFocusKey,
    criteria,
    criteriaSheetOpen,
    hasNavigated,
    updateCriteria,
    openCriteriaSheet,
    closeCriteriaSheet,
    goToResults,
    returnToHome,
    goToEveningPerformances,
    consumeAnchor,
    openPlay,
    selectPerformance,
    returnFromPlayPage,
    readScrollPosition,
    rememberScrollPosition,
    readActivePlay,
    rememberActivePlay,
  };
}

export type Journey = ReturnType<typeof useJourney>;
