import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { useCarousel } from './useCarousel';

/** Renders the real production hook once and displays what it derives: active play, index, arrows. */
function Probe({ playIds, initial }: { readonly playIds: readonly string[]; readonly initial: string | null }) {
  const carousel = useCarousel(playIds, () => initial);
  return (
    <p>
      {`${carousel.activePlayId ?? 'aucune'}|${String(carousel.index)}|${carousel.canGoBack ? 'recule' : 'butée-début'}|${carousel.canAdvance ? 'avance' : 'butée-fin'}`}
    </p>
  );
}

const rendered = (playIds: readonly string[], initial: string | null) =>
  renderToStaticMarkup(<Probe playIds={playIds} initial={initial} />).replace(/<\/?p>/g, '');

describe('carousel: initial selection on mount (real hook)', () => {
  const list = ['misanthrope', 'jeu', 'avare', 'cyrano'];

  it('finds the remembered play, whatever its position', () => {
    expect(rendered(list, 'avare')).toBe('avare|2|recule|avance');
  });

  it('first play: « précédente » arrow at its limit; last play: « suivante » arrow at its limit', () => {
    expect(rendered(list, 'misanthrope')).toBe('misanthrope|0|butée-début|avance');
    expect(rendered(list, 'cyrano')).toBe('cyrano|3|recule|butée-fin');
  });

  it('a remembered play missing from the list is replaced by the first available play', () => {
    expect(rendered(list, 'huis-clos')).toBe('misanthrope|0|butée-début|avance');
  });

  it('no remembered play: first play', () => {
    expect(rendered(list, null)).toBe('misanthrope|0|butée-début|avance');
  });

  it('empty list: no active play, no active arrow', () => {
    expect(rendered([], 'jeu')).toBe('aucune|0|butée-début|butée-fin');
  });
});
