import type { MouseEvent } from 'react';

/** Primary click without modifiers: a modified click (new tab, etc.) is left to the browser. */
export function isPlainClick(event: MouseEvent): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/**
 * Click handler for an internal link (`<a href>`): a plain click is handled (the browser navigation is
 * cancelled, `act` takes care of it); a modified click (Ctrl, Cmd, Shift, Alt, middle button) follows the
 * link normally, so opening in a new tab is preserved. `act` receives the event when the decision
 * depends on it (for example keyboard activation: `detail === 0`).
 */
export function onPlainClick<E extends Element>(act: (event: MouseEvent<E>) => void) {
  return (event: MouseEvent<E>): void => {
    if (!isPlainClick(event)) {
      return;
    }
    event.preventDefault();
    act(event);
  };
}
