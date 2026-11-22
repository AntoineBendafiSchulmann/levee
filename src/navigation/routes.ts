import type { PlayPageTarget } from '../domain/performances';

export type Screen = 'home' | 'results' | 'play';

/** Where the user comes from when opening a play page: determines the label and target of the back button. */
export type PlayPageSource = 'home' | 'results';

export interface Route {
  readonly screen: Screen;
  /** Present only for the `play` screen. */
  readonly target: PlayPageTarget | null;
}

const HOME: Route = { screen: 'home', target: null };

function decode(segment: string): string | null {
  try {
    const text = decodeURIComponent(segment);
    return text === '' ? null : text;
  } catch {
    return null;
  }
}

/**
 * Known addresses: `/` (home), `/seances` (results), `/piece/:playId` and `/seances/:performanceId`
 * (detail page). An unknown address shows the home page, as before; a detail page's identifier is only checked
 * when it is resolved (detail page not found).
 */
export function parseRoute(path: string): Route {
  const segments = path.split('/').filter((s) => s !== '');
  const [first, rawId, ...rest] = segments;
  if (rest.length > 0) {
    return HOME;
  }
  if (first === 'seances' && rawId === undefined) {
    return { screen: 'results', target: null };
  }
  if ((first === 'piece' || first === 'seances') && rawId !== undefined) {
    const id = decode(rawId);
    return id === null ? HOME : { screen: 'play', target: { type: first === 'piece' ? 'play' : 'performance', id } };
  }
  return HOME;
}

export function pathForTarget(target: PlayPageTarget): string {
  return `${target.type === 'play' ? '/piece' : '/seances'}/${encodeURIComponent(target.id)}`;
}

export function pathForScreen(screen: Exclude<Screen, 'play'>): string {
  return screen === 'home' ? '/' : '/seances';
}

/** Default source of a play page opened directly: a performance comes from the results, a play from the home page. */
export function defaultSource(route: Route): PlayPageSource {
  return route.target?.type === 'performance' ? 'results' : 'home';
}

/** Identifier (and address anchor) of the evening performances below the home page: `/#seances-du-soir`. */
export const EVENING_ANCHOR_ID = 'seances-du-soir';

/**
 * Anchor requested by the address on opening: `/#seances-du-soir` (header link opened in a new tab, or a
 * reloaded page) leads to the evening performances. Without this reading, the browser would not scroll: the
 * evening performances section is inside the page's scroll container, rendered after loading.
 */
export function anchorFromUrl(path: string, hash: string): 'evening-performances' | null {
  return parseRoute(path).screen === 'home' && hash === `#${EVENING_ANCHOR_ID}` ? 'evening-performances' : null;
}
