import { describe, expect, it } from 'vitest';

import { explicationSeance } from './explication';
import { DEUX_DUREES, resultatPour, type Cas } from './fixtures.test-utils';

const REF: Cas = { durees: DEUX_DUREES, debutMinutes: 1200, limiteMinutes: 1310, avecTrajet: true };
const texte = (cas: Cas) => {
  const { resultat, criteres } = resultatPour(cas);
  return explicationSeance(resultat, criteres, 'République');
};

const SANS_TRAJET = 'Aucun trajet n’est estimé depuis République : l’heure d’arrivée ne peut pas être calculée.';
const DUREES_ANNONCEES =
  'Deux durées sont annoncées : 1 h 45 et 1 h 55. La séance peut finir entre 21h45 et 21h55. Votre limite est 21h50.';

describe('fin incertaine', () => {
  it('cas de référence : durées annoncées, plage de fin, limite', () => {
    expect(texte(REF)).toBe(DUREES_ANNONCEES);
  });

  it('plus de deux durées : énumération et nombre calculés', () => {
    const durees = [100, 110, 120].map((minutes) => ({ minutes, source: 'x' }));
    expect(texte({ ...REF, durees, limiteMinutes: 1310 })).toBe(
      '3 durées sont annoncées : 1 h 40, 1 h 50 et 2 h 00. La séance peut finir entre 21h40 et 22h00. Votre limite est 21h50.',
    );
  });

  it('n’emploie plus « selon la bonne »', () => {
    expect(texte(REF)).not.toContain('selon la bonne');
  });
});

describe('trajet non estimé : le texte dit aussi le reste', () => {
  const sansTrajet: Cas = { ...REF, avecTrajet: false };

  it('durée inconnue', () => {
    expect(texte({ ...sansTrajet, durees: [] })).toBe(`${SANS_TRAJET} Durée non annoncée : la fin ne peut pas être calculée.`);
  });

  it('plage de fin qui chevauche la limite', () => {
    expect(texte(sansTrajet)).toBe(`${SANS_TRAJET} ${DUREES_ANNONCEES}`);
  });

  it('plage dont la fin la plus courte tombe pile sur la limite : elle chevauche encore', () => {
    expect(texte({ ...sansTrajet, limiteMinutes: 1305 })).toContain('La séance peut finir entre 21h45 et 21h55. Votre limite est 21h45.');
  });

  it('plage dont la fin la plus longue tombe pile sur la limite : compatible, rien à ajouter', () => {
    expect(texte({ ...sansTrajet, limiteMinutes: 1315 })).toBe(SANS_TRAJET);
  });

  it('plage entièrement avant la limite : rien à ajouter', () => {
    expect(texte({ ...sansTrajet, limiteMinutes: 1320 })).toBe(SANS_TRAJET);
  });

  it('fin exactement à la limite : rien à ajouter', () => {
    const unique = [{ minutes: 110, source: 'Théâtre' }];
    expect(texte({ durees: unique, debutMinutes: 1170, limiteMinutes: 1280, avecTrajet: false })).toBe(SANS_TRAJET);
  });

  it('fin certainement trop tardive : impossible, avec son propre texte', () => {
    const longue = [{ minutes: 165, source: 'Théâtre' }];
    expect(texte({ durees: longue, debutMinutes: 1200, limiteMinutes: 1320, avecTrajet: false })).toBe(
      'Fin calculée à 22h45, soit 45 min après votre limite.',
    );
  });
});

describe('autres statuts', () => {
  it('une séance à temps n’a pas de phrase', () => {
    expect(texte({ ...REF, limiteMinutes: 1320 })).toBeNull();
  });

  it('durée inconnue avec trajet : ce qu’il faudrait pour sortir à temps', () => {
    expect(texte({ ...REF, durees: [] })).toBe(
      'Durée non annoncée : la fin ne peut pas être calculée. Il faudrait 1 h 50 au plus pour sortir au plus tard à 21h50.',
    );
  });
});
