import { useSyncExternalStore } from 'react';

const DESKTOP_QUERY = '(min-width: 1100px)';

function subscribe(notify: () => void): () => void {
  const mediaQuery = window.matchMedia(DESKTOP_QUERY);
  mediaQuery.addEventListener('change', notify);
  return () => {
    mediaQuery.removeEventListener('change', notify);
  };
}

/**
 * True from the « bureau » (desktop) threshold (1100 px, same as the `bureau:` classes): the index-driven stage, with its
 * neighbours on either side. Below it, native scrolling with snapping. Follows resizing.
 */
export function useDesktopBreakpoint(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}
