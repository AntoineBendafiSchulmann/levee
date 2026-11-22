import { describe, expect, it } from 'vitest';

import { ramenerEnVue } from './focus';

interface Boite {
  top: number;
  height: number;
}
const rect = ({ top, height }: Boite) => ({ top, bottom: top + height, height }) as DOMRect;

/** Un conteneur et un lien factices : seules les boîtes (en pixels écran), `closest` et `scrollTop` comptent ici. */
function monter(zone: Boite, lien: Boite, carte: Boite | null) {
  const conteneur = { scrollTop: 1000, getBoundingClientRect: () => rect(zone) };
  const element = {
    getBoundingClientRect: () => rect(lien),
    closest: () => (carte === null ? null : { getBoundingClientRect: () => rect(carte) }),
  };
  return { conteneur: conteneur as unknown as HTMLElement, element: element as unknown as HTMLElement, lire: () => conteneur.scrollTop };
}

// Zone de lecture : de 0 à 844 ; bandeau collant jusqu'à 174.
const ZONE = { top: 0, height: 844 };
const BANDEAU = 174;

describe('ramener le lien focalisé dans la zone de lecture', () => {
  it('lien déjà visible : la position ne bouge pas d’un pixel', () => {
    const { conteneur, element, lire } = monter(ZONE, { top: 384, height: 60 }, { top: 300, height: 500 });
    ramenerEnVue(element, conteneur, BANDEAU);
    expect(lire()).toBe(1000);
  });

  it('lien juste sous le bandeau (bord exact) ou au bas de la zone : toujours visible, pas de recentrage', () => {
    for (const lien of [{ top: BANDEAU, height: 60 }, { top: 784, height: 60 }]) {
      const { conteneur, element, lire } = monter(ZONE, lien, null);
      ramenerEnVue(element, conteneur, BANDEAU);
      expect(lire()).toBe(1000);
    }
  });

  it('lien hors écran en bas (après une actualisation) : la carte est centrée dans la zone de lecture', () => {
    const { conteneur, element, lire } = monter(ZONE, { top: 2100, height: 60 }, { top: 2000, height: 460 });
    ramenerEnVue(element, conteneur, BANDEAU);
    // Zone visible de 174 à 844 (670 px) : la carte de 460 px est centrée, haut à 174 + 105 = 279.
    expect(lire()).toBe(1000 + (2000 - 279));
  });

  it('lien partiellement sous le bandeau : ramené en vue', () => {
    const { conteneur, element, lire } = monter(ZONE, { top: 161, height: 60 }, { top: 100, height: 460 });
    ramenerEnVue(element, conteneur, BANDEAU);
    expect(lire()).toBe(1000 + (100 - 279));
  });

  it('carte plus haute que la zone de lecture : on centre le lien lui-même', () => {
    const { conteneur, element, lire } = monter({ top: 0, height: 400 }, { top: 900, height: 60 }, { top: 700, height: 600 });
    ramenerEnVue(element, conteneur, 100);
    // Zone de 100 à 400 : le lien de 60 px est centré, haut à 100 + 120 = 220.
    expect(lire()).toBe(1000 + (900 - 220));
  });

  it('sans bandeau (ordinateur) : la zone entière sert de zone de lecture', () => {
    const { conteneur, element, lire } = monter(ZONE, { top: -50, height: 60 }, null);
    ramenerEnVue(element, conteneur, 0);
    expect(lire()).toBe(1000 + (-50 - 392));
  });
});
