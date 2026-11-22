import { describe, expect, it } from 'vitest';

import { scrollIntoReadingView } from './focus';

interface Box {
  top: number;
  height: number;
}
const rect = ({ top, height }: Box) => ({ top, bottom: top + height, height }) as DOMRect;

/** A fake container and link: only the boxes (in screen pixels), `closest` and `scrollTop` matter here. */
function mount(zone: Box, link: Box, card: Box | null) {
  const container = { scrollTop: 1000, getBoundingClientRect: () => rect(zone) };
  const element = {
    getBoundingClientRect: () => rect(link),
    closest: () => (card === null ? null : { getBoundingClientRect: () => rect(card) }),
  };
  return { container: container as unknown as HTMLElement, element: element as unknown as HTMLElement, read: () => container.scrollTop };
}

// Reading area: 0 to 844; sticky banner down to 174.
const ZONE = { top: 0, height: 844 };
const HEADER_HEIGHT = 174;

describe('bringing the focused link back into the reading area', () => {
  it('link already visible: the position does not move by a pixel', () => {
    const { container, element, read } = mount(ZONE, { top: 384, height: 60 }, { top: 300, height: 500 });
    scrollIntoReadingView(element, container, HEADER_HEIGHT);
    expect(read()).toBe(1000);
  });

  it('link just below the banner (exact edge) or at the bottom of the area: still visible, no recentring', () => {
    for (const link of [{ top: HEADER_HEIGHT, height: 60 }, { top: 784, height: 60 }]) {
      const { container, element, read } = mount(ZONE, link, null);
      scrollIntoReadingView(element, container, HEADER_HEIGHT);
      expect(read()).toBe(1000);
    }
  });

  it('link off-screen at the bottom (after a refresh): the card is centred in the reading area', () => {
    const { container, element, read } = mount(ZONE, { top: 2100, height: 60 }, { top: 2000, height: 460 });
    scrollIntoReadingView(element, container, HEADER_HEIGHT);
    // Visible area 174 to 844 (670 px): the 460 px card is centred, top at 174 + 105 = 279.
    expect(read()).toBe(1000 + (2000 - 279));
  });

  it('link partly under the banner: brought into view', () => {
    const { container, element, read } = mount(ZONE, { top: 161, height: 60 }, { top: 100, height: 460 });
    scrollIntoReadingView(element, container, HEADER_HEIGHT);
    expect(read()).toBe(1000 + (100 - 279));
  });

  it('card taller than the reading area: the link itself is centred', () => {
    const { container, element, read } = mount({ top: 0, height: 400 }, { top: 900, height: 60 }, { top: 700, height: 600 });
    scrollIntoReadingView(element, container, 100);
    // Area 100 to 400: the 60 px link is centred, top at 100 + 120 = 220.
    expect(read()).toBe(1000 + (900 - 220));
  });

  it('no banner (desktop): the whole area is the reading area', () => {
    const { container, element, read } = mount(ZONE, { top: -50, height: 60 }, null);
    scrollIntoReadingView(element, container, 0);
    expect(read()).toBe(1000 + (-50 - 392));
  });
});
