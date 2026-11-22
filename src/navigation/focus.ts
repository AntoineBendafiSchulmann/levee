/** Elements that can regain focus on return from a detail page carry `data-focus-key` (the key of the performance or play). */
export function focusByKey(key: string): HTMLElement | null {
  const element = document.querySelector<HTMLElement>(`[data-focus-key="${CSS.escape(key)}"]`);
  element?.focus({ preventScroll: true });
  return element;
}

/**
 * Keeps `element` within the reading area of a vertically scrolling container. `hiddenTop` is the bottom
 * edge of a sticky banner covering the top of the container (0 if there is none). An element that is already
 * visible does not move by a pixel; otherwise its card (`closest('article')`) is centred in the reading area,
 * or the element itself if the card is taller than the area.
 */
export function scrollIntoReadingView(element: HTMLElement, container: HTMLElement, hiddenTop: number): void {
  const zone = container.getBoundingClientRect();
  const top = Math.max(zone.top, hiddenTop);
  const bottom = zone.bottom;
  const link = element.getBoundingClientRect();
  if (link.top >= top && link.bottom <= bottom) {
    return;
  }
  const card = element.closest('article')?.getBoundingClientRect();
  const target = card !== undefined && card.height <= bottom - top ? card : link;
  container.scrollTop += target.top - top - (bottom - top - target.height) / 2;
}
