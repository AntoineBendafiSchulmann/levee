import { describe, expect, it } from 'vitest';

import { evaluerSeance, SEUIL_ARRIVEE_SERREE_MINUTES, type EntreeEvaluation, type StatutSeance } from './evaluation';

/** Départ 18h30, limite 22h00, trajet de 14 min : arrivée 18h44. Le début et les durées varient. */
function evaluer(surcharge: Partial<EntreeEvaluation> = {}) {
  return evaluerSeance({
    debutMinutes: 19 * 60 + 30,
    durees: [{ minutes: 110, source: 'Théâtre' }],
    trajet: { minutes: 14 },
    departMinutes: 18 * 60 + 30,
    limiteMinutes: 22 * 60,
    ...surcharge,
  });
}

describe('séance joignable', () => {
  it('calcule l’arrivée estimée, la marge et la fin à partir des valeurs annoncées', () => {
    const e = evaluer();
    expect(e.statut).toBe('a-temps');
    expect(e.groupe).toBe('possible');
    expect(e.trajetMinutes).toBe(14);
    expect(e.arriveeMinutes).toBe(18 * 60 + 44);
    expect(e.margeArriveeMinutes).toBe(46);
    expect(e.fin).toEqual({ min: 21 * 60 + 20, max: 21 * 60 + 20 });
  });
});

describe('arrivée par rapport au début (arrivée estimée 18h44)', () => {
  it.each<[string, number, StatutSeance]>([
    ['1 minute après le début', 18 * 60 + 43, 'arrivee-tardive'],
    ['pile au début : marge de 0 minute', 18 * 60 + 44, 'arrivee-serree'],
    ['marge de 1 minute', 18 * 60 + 45, 'arrivee-serree'],
    ['marge de 9 minutes : sous le seuil', 18 * 60 + 53, 'arrivee-serree'],
    ['marge de 10 minutes exactement : le qualificatif disparaît', 18 * 60 + 54, 'a-temps'],
    ['marge de 11 minutes', 18 * 60 + 55, 'a-temps'],
  ])('%s', (_, debutMinutes, attendu) => {
    expect(evaluer({ debutMinutes }).statut).toBe(attendu);
  });

  it('classe une arrivée tardive comme impossible, avec la marge négative réelle', () => {
    const e = evaluer({ debutMinutes: 18 * 60 + 35 });
    expect(e.groupe).toBe('impossible');
    expect(e.margeArriveeMinutes).toBe(-9);
  });

  it('s’appuie sur une constante nommée pour le seuil', () => {
    expect(SEUIL_ARRIVEE_SERREE_MINUTES).toBe(10);
  });
});

describe('sortie par rapport à la limite (22h00 = 1320)', () => {
  // Début 19h30 (1170) + 110 min = fin à 1280 : la limite est placée pile sur la fin.
  it('fin exactement à la limite : compatible', () => {
    const e = evaluer({ limiteMinutes: 1280 });
    expect(e.fin).toEqual({ min: 1280, max: 1280 });
    expect(e.statut).toBe('a-temps');
  });

  it('fin une minute après la limite : impossible', () => {
    const e = evaluer({ limiteMinutes: 1279 });
    expect(e.statut).toBe('fin-depassee');
    expect(e.groupe).toBe('impossible');
  });

  it('fin largement après la limite (Cyrano, 22h45 pour 22h00) : impossible', () => {
    expect(evaluer({ debutMinutes: 1200, durees: [{ minutes: 165, source: 'Théâtre' }] }).statut).toBe('fin-depassee');
  });
});

describe('deux durées annoncées : plage 21h45–21h55 (début 20h00, 105 ou 115 min)', () => {
  const durees = [
    { minutes: 105, source: 'Site du théâtre' },
    { minutes: 115, source: 'Billetterie partenaire' },
  ];
  const jeu = (limiteMinutes: number) => evaluer({ debutMinutes: 1200, durees, limiteMinutes });

  it('donne une plage de fin', () => {
    expect(jeu(1320).fin).toEqual({ min: 1305, max: 1315 });
  });

  it.each<[string, number, StatutSeance]>([
    ['limite 22h00 : les deux durées conviennent', 1320, 'a-temps'],
    ['limite 21h55, égale à la fin la plus longue : compatible', 1315, 'a-temps'],
    ['limite 21h50, entre les deux : incertaine', 1310, 'fin-incertaine'],
    ['limite 21h45, égale à la fin la plus courte seulement : reste incertaine', 1305, 'fin-incertaine'],
    ['limite 21h44, même la durée courte dépasse : impossible', 1304, 'fin-depassee'],
  ])('%s', (_, limite, attendu) => {
    expect(jeu(limite).statut).toBe(attendu);
  });

  it('range l’incertitude parmi les séances à vérifier', () => {
    expect(jeu(1310).groupe).toBe('a-verifier');
  });

  it('deux sources qui annoncent la même durée ne font pas une plage', () => {
    const e = evaluer({
      durees: [
        { minutes: 110, source: 'Théâtre' },
        { minutes: 110, source: 'Billetterie' },
      ],
    });
    expect(e.fin?.min).toBe(e.fin?.max);
    expect(e.statut).toBe('a-temps');
  });
});

describe('données manquantes', () => {
  it('une durée manquante reste inconnue : la fin ne se calcule pas', () => {
    const e = evaluer({ durees: [] });
    expect(e.statut).toBe('duree-inconnue');
    expect(e.groupe).toBe('a-verifier');
    expect(e.fin).toBeNull();
  });

  it('un trajet manquant empêche d’estimer l’arrivée', () => {
    const e = evaluer({ trajet: undefined });
    expect(e.statut).toBe('trajet-inconnu');
    expect(e.groupe).toBe('a-verifier');
    expect(e.arriveeMinutes).toBeNull();
    expect(e.margeArriveeMinutes).toBeNull();
  });

  it('un trajet manquant ne cache pas une fin déjà dépassée, impossible quel que soit le trajet', () => {
    expect(evaluer({ trajet: undefined, limiteMinutes: 1279 }).statut).toBe('fin-depassee');
  });

  // Trajet manquant combiné aux autres incertitudes : le statut reste « trajet-inconnu » (à vérifier),
  // la carte dit le reste dans son texte (voir explication.test.ts).
  it('trajet manquant et durée inconnue : « trajet-inconnu », sans fin calculable', () => {
    const e = evaluer({ trajet: undefined, durees: [] });
    expect(e.statut).toBe('trajet-inconnu');
    expect(e.groupe).toBe('a-verifier');
    expect(e.fin).toBeNull();
  });

  it('trajet manquant et fin incertaine : « trajet-inconnu », la plage de fin est conservée', () => {
    const e = evaluer({
      trajet: undefined,
      debutMinutes: 1200,
      limiteMinutes: 1310,
      durees: [
        { minutes: 105, source: 'a' },
        { minutes: 115, source: 'b' },
      ],
    });
    expect(e.statut).toBe('trajet-inconnu');
    expect(e.fin).toEqual({ min: 1305, max: 1315 });
  });

  it('trajet manquant et fin exactement à la limite : « trajet-inconnu », pas « à temps »', () => {
    const e = evaluer({ trajet: undefined, limiteMinutes: 1280 });
    expect(e.fin).toEqual({ min: 1280, max: 1280 });
    expect(e.statut).toBe('trajet-inconnu');
  });
});

describe('priorités entre les cas', () => {
  it('une arrivée tardive l’emporte sur une durée inconnue', () => {
    expect(evaluer({ debutMinutes: 18 * 60 + 40, durees: [] }).statut).toBe('arrivee-tardive');
  });

  it('une durée inconnue l’emporte sur une arrivée serrée', () => {
    expect(evaluer({ debutMinutes: 18 * 60 + 49, durees: [] }).statut).toBe('duree-inconnue');
  });

  it('une fin dépassée l’emporte sur une arrivée serrée', () => {
    expect(evaluer({ debutMinutes: 18 * 60 + 49, limiteMinutes: 1000 }).statut).toBe('fin-depassee');
  });

  it('une fin incertaine l’emporte sur une arrivée serrée', () => {
    const durees = [
      { minutes: 105, source: 'a' },
      { minutes: 115, source: 'b' },
    ];
    expect(evaluer({ debutMinutes: 18 * 60 + 49, durees, limiteMinutes: 18 * 60 + 49 + 110 }).statut).toBe('fin-incertaine');
  });

  it('une arrivée tardive l’emporte sur une fin dépassée', () => {
    expect(evaluer({ debutMinutes: 18 * 60 + 40, limiteMinutes: 1000 }).statut).toBe('arrivee-tardive');
  });
});
