import { describe, expect, it } from 'vitest';

import { analyserChemin, ancreDepuisAdresse, cheminCible, ID_SELECTION, origineParDefaut } from './chemins';

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

describe('ancre de la sélection de séances', () => {
  it('l’adresse /#seances-du-soir de l’en-tête demande la sélection, et seulement sur l’accueil', () => {
    expect(ID_SELECTION).toBe('seances-du-soir');
    expect(ancreDepuisAdresse('/', '#seances-du-soir')).toBe('selection');
    expect(ancreDepuisAdresse('/seances', '#seances-du-soir')).toBeNull();
    expect(ancreDepuisAdresse('/piece/avare', '#seances-du-soir')).toBeNull();
  });

  it('sans ancre, ou avec une autre ancre : rien à faire', () => {
    expect(ancreDepuisAdresse('/', '')).toBeNull();
    expect(ancreDepuisAdresse('/', '#autre')).toBeNull();
  });
});
