import { describe, expect, it } from 'vitest';

import { normaliser, pluriel } from './texte';
import { dureesDistinctes, formaterDistance, formaterDuree, formaterPlageHeures, formaterHeure, libelleJourBref, libelleJourCourt, libelleJourDu, libelleJourLong, libelleMinutes } from './temps';

describe('temps', () => {
  it('formate les heures et les durées', () => {
    expect(formaterHeure(1320)).toBe('22h00');
    expect(formaterHeure(1215)).toBe('20h15');
    expect(formaterDuree(110)).toBe('1 h 50');
    expect(formaterDuree(60)).toBe('1 h 00');
    expect(formaterDuree(45)).toBe('45 min');
    expect(libelleMinutes(105)).toBe('105 min');
  });

  it('formate les jours sans dépendre du fuseau horaire', () => {
    expect(libelleJourLong('2026-11-26')).toBe('Jeudi 26 novembre');
    expect(libelleJourCourt('2026-11-26', '2026-11-26')).toBe('Ce soir');
    expect(libelleJourCourt('2026-11-28', '2026-11-26')).toBe('Sam. 28');
    expect(libelleJourDu('2026-11-26', '2026-11-26')).toBe('ce soir');
    expect(libelleJourDu('2026-11-28', '2026-11-26')).toBe('samedi');
  });

  it('refuse un jour mal formé', () => {
    expect(() => libelleJourLong('28/11/2026')).toThrow(/Jour invalide/);
  });
});

describe('texte', () => {
  it('met au pluriel à partir de 2', () => {
    expect(pluriel(0, 'séance', 'séances')).toBe('0 séance');
    expect(pluriel(1, 'séance', 'séances')).toBe('1 séance');
    expect(pluriel(2, 'séance', 'séances')).toBe('2 séances');
  });

  it('normalise accents, casse et espaces', () => {
    expect(normaliser('  Molière ')).toBe('moliere');
    expect(normaliser('ÉDMOND')).toBe('edmond');
  });

  it('formate le jour abrégé et la distance', () => {
    expect(libelleJourBref('2026-11-28')).toBe('sam. 28 nov.');
    expect(formaterDistance(0.35)).toBe('350 m');
    expect(formaterDistance(2.4)).toBe('2,4 km');
    expect(formaterDistance(3)).toBe('3,0 km');
  });
});

describe('plage de fin et durées distinctes', () => {
  it('fin certaine : une heure ; deux durées annoncées : une plage', () => {
    expect(formaterPlageHeures({ min: 1310, max: 1310 })).toBe('21h50');
    expect(formaterPlageHeures({ min: 1305, max: 1315 })).toBe('21h45–21h55');
  });

  it('durées distinctes : sans doublon, de la plus courte à la plus longue, vide si aucune n’est annoncée', () => {
    expect(dureesDistinctes([])).toEqual([]);
    expect(
      dureesDistinctes([
        { minutes: 115, source: 'Billetterie partenaire' },
        { minutes: 105, source: 'Site du théâtre' },
        { minutes: 115, source: 'Autre source' },
      ]),
    ).toEqual([105, 115]);
  });
});
