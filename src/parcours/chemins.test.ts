import { describe, expect, it } from 'vitest';

import { analyserChemin, cheminCible, origineParDefaut } from './chemins';

describe('adresses du parcours', () => {
  it('reconnaît l’accueil, les résultats et les fiches', () => {
    expect(analyserChemin('/')).toEqual({ ecran: 'accueil', cible: null });
    expect(analyserChemin('/seances')).toEqual({ ecran: 'resultats', cible: null });
    expect(analyserChemin('/seances/')).toEqual({ ecran: 'resultats', cible: null });
    expect(analyserChemin('/piece/jeu-amour-hasard')).toEqual({ ecran: 'fiche', cible: { type: 'piece', id: 'jeu-amour-hasard' } });
    expect(analyserChemin('/seances/jeu-amour-hasard-2026-11-28-1200')).toEqual({
      ecran: 'fiche',
      cible: { type: 'seance', id: 'jeu-amour-hasard-2026-11-28-1200' },
    });
  });

  it('retombe sur l’accueil pour une adresse inconnue ou mal formée', () => {
    for (const chemin of ['/n-importe-quoi', '/piece', '/piece/a/b', '/seances/a/b', '/piece/%E0%A4%A']) {
      expect(analyserChemin(chemin).ecran).toBe('accueil');
    }
  });

  it('cheminCible et analyserChemin sont inverses', () => {
    for (const cible of [{ type: 'piece', id: 'avare' }, { type: 'seance', id: 'avare-2026-11-28-1125' }] as const) {
      expect(analyserChemin(cheminCible(cible)).cible).toEqual(cible);
    }
  });

  it('une fiche ouverte directement revient à l’écran naturel : séance → résultats, pièce → accueil', () => {
    expect(origineParDefaut(analyserChemin('/seances/x'))).toBe('resultats');
    expect(origineParDefaut(analyserChemin('/piece/x'))).toBe('accueil');
  });
});
