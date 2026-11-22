import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { useCarrousel } from './useCarrousel';

/** Rend une fois le vrai hook de production et affiche ce qu'il en déduit : pièce active, indice, flèches. */
function Sonde({ ids, initial }: { readonly ids: readonly string[]; readonly initial: string | null }) {
  const carrousel = useCarrousel(ids, () => initial);
  return (
    <p>
      {`${carrousel.idActif ?? 'aucune'}|${String(carrousel.indice)}|${carrousel.peutReculer ? 'recule' : 'butée-début'}|${carrousel.peutAvancer ? 'avance' : 'butée-fin'}`}
    </p>
  );
}

const rendu = (ids: readonly string[], initial: string | null) =>
  renderToStaticMarkup(<Sonde ids={ids} initial={initial} />).replace(/<\/?p>/g, '');

describe('carrousel : sélection initiale au montage (hook réel)', () => {
  const liste = ['misanthrope', 'jeu', 'avare', 'cyrano'];

  it('retrouve la pièce mémorisée, quelle que soit sa position', () => {
    expect(rendu(liste, 'avare')).toBe('avare|2|recule|avance');
  });

  it('première pièce : flèche « précédente » en butée ; dernière : flèche « suivante » en butée', () => {
    expect(rendu(liste, 'misanthrope')).toBe('misanthrope|0|butée-début|avance');
    expect(rendu(liste, 'cyrano')).toBe('cyrano|3|recule|butée-fin');
  });

  it('une pièce mémorisée absente de la liste est remplacée par la première pièce disponible', () => {
    expect(rendu(liste, 'huis-clos')).toBe('misanthrope|0|butée-début|avance');
  });

  it('sans pièce mémorisée : première pièce', () => {
    expect(rendu(liste, null)).toBe('misanthrope|0|butée-début|avance');
  });

  it('liste vide : aucune pièce active, aucune flèche active', () => {
    expect(rendu([], 'jeu')).toBe('aucune|0|butée-début|butée-fin');
  });
});
