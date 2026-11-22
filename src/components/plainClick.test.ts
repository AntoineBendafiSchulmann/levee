import type { MouseEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { isPlainClick, onPlainClick } from './plainClick';

function click(overrides: Partial<Pick<MouseEvent, 'button' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>> = {}) {
  const preventDefault = vi.fn();
  const event = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, preventDefault, ...overrides };
  return { event: event as unknown as MouseEvent, preventDefault };
}

describe('plain click on an internal link', () => {
  it('a plain click cancels the browser navigation and triggers the action', () => {
    const act = vi.fn();
    const { event, preventDefault } = click();
    onPlainClick(act)(event);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(act).toHaveBeenCalledTimes(1);
  });

  it('a modified click follows the link: new tab (Ctrl, Cmd), new window (Shift), download (Alt), middle button', () => {
    for (const overrides of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      const act = vi.fn();
      const { event, preventDefault } = click(overrides);
      expect(isPlainClick(event)).toBe(false);
      onPlainClick(act)(event);
      expect(preventDefault).not.toHaveBeenCalled();
      expect(act).not.toHaveBeenCalled();
    }
  });

  it('the action receives the event: keyboard activation (detail 0) can thus be told apart from a mouse click', () => {
    const received: unknown[] = [];
    const { event } = click();
    onPlainClick((e) => received.push(e))(event);
    expect(received).toEqual([event]);
  });
});
