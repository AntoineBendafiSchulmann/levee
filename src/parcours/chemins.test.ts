import { describe, expect, it } from 'vitest';

import { analyserChemin, ancreDepuisUrl, cheminCible, ID_SEANCES_DU_SOIR, provenanceParDefaut } from './chemins';

describe('adresses du parcours', () => {
  it('reconnaît l’accueil, les résultats et les fiches', () => {
    expect(analyserChemin('/')).toEqual({ ecran: 'accueil', cible: null });
    expect(analyserChemin('/seances')).toEqual({ ecran: 'resultats', cible: null });
    expect(analyserChemin('/seances/')).toEqual({ ecran: 'resultats', cible: null });
    expect(analyserChemin('/piece/jeu-amour-hasard')).toEqual({ ecran: 'piece', cible: { type: 'piece', id: 'jeu-amour-hasard' } });
    expect(analyserChemin('/seances/jeu-amour-hasard-2026-11-28-1200')).toEqual({
      ecran: 'piece',
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
    expect(provenanceParDefaut(analyserChemin('/seances/x'))).toBe('resultats');
    expect(provenanceParDefaut(analyserChemin('/piece/x'))).toBe('accueil');
  });
});

describe('ancre des séances du soir', () => {
  it('l’adresse /#seances-du-soir de l’en-tête demande les séances du soir, et seulement sur l’accueil', () => {
    expect(ID_SEANCES_DU_SOIR).toBe('seances-du-soir');
    expect(ancreDepuisUrl('/', '#seances-du-soir')).toBe('seances-du-soir');
    expect(ancreDepuisUrl('/seances', '#seances-du-soir')).toBeNull();
    expect(ancreDepuisUrl('/piece/avare', '#seances-du-soir')).toBeNull();
  });

  it('sans ancre, ou avec une autre ancre : rien à faire', () => {
    expect(ancreDepuisUrl('/', '')).toBeNull();
    expect(ancreDepuisUrl('/', '#autre')).toBeNull();
  });
});
