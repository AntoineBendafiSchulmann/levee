import { describe, expect, it } from 'vitest';

import { DEMO_INITIAL_CRITERIA } from '../demo-data/criteria.demo';
import { DEMO_VENUES } from '../demo-data/venues.demo';
import { DEMO_PLAYS } from '../demo-data/plays.demo';
import { viewButtonLabel, countersLabel, buildResults } from './results';
import type { OutingCriteria, Venue, Play } from './types';

const SATURDAY = '2026-11-28';
const criteria = (overrides: Partial<OutingCriteria> = {}): OutingCriteria => ({
  ...DEMO_INITIAL_CRITERIA,
  ...overrides,
});
const compute = (overrides: Partial<OutingCriteria> = {}) =>
  buildResults(DEMO_PLAYS, DEMO_VENUES, criteria(overrides));
const summary = (overrides: Partial<OutingCriteria> = {}) =>
  compute(overrides).visible.map((r) => `${r.play.title} ${String(r.performance.startMinutes)} ${r.evaluation.status}`);

describe('reference journey: Saturday 28 November, République 18:30, limit 22:00', () => {
  const results = compute({ day: SATURDAY });

  it('lists six performances, by start time', () => {
    expect(results.visible.map((r) => r.performance.startMinutes)).toEqual([1125, 1140, 1170, 1200, 1200, 1215]);
  });

  it('classifies each performance as in the mock-up', () => {
    expect(summary({ day: SATURDAY })).toEqual([
      'L’Avare 1125 late-arrival',
      'Un dîner chez les Vasseur 1140 unknown-duration',
      'Le Misanthrope 1170 on-time',
      'Cyrano de Bergerac 1200 ends-too-late',
      'Le Jeu de l’amour et du hasard 1200 on-time',
      'La Clé sous la porte 1215 on-time',
    ]);
  });

  it('totals 3 feasible, 1 to check, 2 impossible', () => {
    expect(results.counters).toEqual({ feasible: 3, toCheck: 1, impossible: 2 });
  });

  it('sets aside performances that start before departure, without evaluating them', () => {
    expect(results.beforeDeparture.map((s) => `${s.title} ${String(s.startMinutes)}`)).toEqual([
      'Le Jeu de l’amour et du hasard 990',
      'Huis clos 1095',
    ]);
  });

  it('listed cards and performances before departure cover all performances of the day', () => {
    const saturdayCount = DEMO_PLAYS.flatMap((s) => s.performances).filter((s) => s.day === SATURDAY).length;
    expect(results.visible.length + results.beforeDeparture.length).toBe(saturdayCount);
  });

  it('on Thursday, the 4 / 1 / 1 totals cover the six evening performances', () => {
    const thursday = compute();
    expect(thursday.counters).toEqual({ feasible: 4, toCheck: 1, impossible: 1 });
    expect(thursday.visible).toHaveLength(6);
  });
});

describe('the same play performed twice on the same day', () => {
  it('gives two distinct results, with different ids', () => {
    const loveAndChance = compute({ day: SATURDAY, departureMinutes: 16 * 60 }).visible.filter(
      (r) => r.play.id === 'jeu-amour-hasard',
    );
    expect(loveAndChance.map((r) => r.performance.startMinutes)).toEqual([990, 1200]);
    expect(new Set(loveAndChance.map((r) => r.id)).size).toBe(2);
    expect(loveAndChance.map((r) => r.evaluation.status)).toEqual(['on-time', 'on-time']);
  });

  it('each performance has its own status when the limit moves to 21:50', () => {
    const loveAndChance = compute({ day: SATURDAY, departureMinutes: 16 * 60, exitLimitMinutes: 21 * 60 + 50 }).visible.filter(
      (r) => r.play.id === 'jeu-amour-hasard',
    );
    expect(loveAndChance.map((r) => r.evaluation.status)).toEqual(['on-time', 'uncertain-end']);
  });

  it('with departure at 18:30, the 16:30 performance is dropped and the 20:00 one remains', () => {
    const loveAndChance = compute({ day: SATURDAY }).visible.filter((r) => r.play.id === 'jeu-amour-hasard');
    expect(loveAndChance.map((r) => r.performance.startMinutes)).toEqual([1200]);
  });
});

describe('reclassification when the limit moves from 22:00 to 21:50', () => {
  it('the 20:00 Jeu de l’amour et du hasard goes from « à temps » to « fin incertaine »', () => {
    const before = summary({ day: SATURDAY }).filter((l) => l.includes('Jeu'));
    const after = summary({ day: SATURDAY, exitLimitMinutes: 21 * 60 + 50 }).filter((l) => l.includes('Jeu'));
    expect(before).toEqual(['Le Jeu de l’amour et du hasard 1200 on-time']);
    expect(after).toEqual(['Le Jeu de l’amour et du hasard 1200 uncertain-end']);
  });
});

describe('filters', () => {
  it('one genre: only plays of that genre', () => {
    const titles = compute({ day: SATURDAY, departureMinutes: 16 * 60, genres: ['drame'] }).visible.map((r) => r.play.title);
    expect(titles).toEqual(['Huis clos']);
  });

  it('several genres: a play with only one of the two is enough', () => {
    const titles = compute({ day: SATURDAY, departureMinutes: 16 * 60, genres: ['drame', 'contemporain'] }).visible.map(
      (r) => r.play.title,
    );
    expect(titles).toEqual(['Huis clos', 'Un dîner chez les Vasseur', 'La Clé sous la porte']);
  });

  it('author: ignoring accents and case (two performances at 20:00 on Thursday, ordered by title)', () => {
    const titles = compute({ author: 'MOLIERE' }).visible.map((r) => r.play.title);
    expect(titles).toEqual(['L’Avare', 'Le Misanthrope']);
  });

  it('author: part of the name is enough', () => {
    expect(compute({ author: 'ormes' }).visible.map((r) => r.play.title)).toEqual(['Un dîner chez les Vasseur']);
  });

  it('genre and author combine', () => {
    expect(compute({ genres: ['drame'], author: 'molière' }).visible).toEqual([]);
  });

  it('a day without performances gives an empty result, without error', () => {
    const empty = compute({ day: '2026-11-30' });
    expect(empty.visible).toEqual([]);
    expect(empty.counters).toEqual({ feasible: 0, toCheck: 0, impossible: 0 });
  });

  it('a departure after all performances leaves nothing to list', () => {
    expect(compute({ departureMinutes: 21 * 60 }).visible).toEqual([]);
  });

  it('orders by title when start times are equal', () => {
    const titles = compute({ day: SATURDAY }).visible.filter((r) => r.performance.startMinutes === 1200).map((r) => r.play.title);
    expect(titles).toEqual(['Cyrano de Bergerac', 'Le Jeu de l’amour et du hasard']);
  });
});

describe('hiding impossible performances', () => {
  const hidden = compute({ day: SATURDAY, hideImpossible: true });

  it('removes impossible cards but keeps the totals of all listed performances', () => {
    expect(hidden.visible).toHaveLength(4);
    expect(hidden.visible.every((r) => r.evaluation.group !== 'impossible')).toBe(true);
    expect(hidden.counters).toEqual({ feasible: 3, toCheck: 1, impossible: 2 });
    expect(hidden.impossibleHidden).toBe(true);
  });

  it('reports nothing when there is no impossible performance to hide', () => {
    expect(compute({ day: '2026-11-27', exitLimitMinutes: 23 * 60, hideImpossible: true }).impossibleHidden).toBe(false);
  });
});

describe('counter and button labels', () => {
  it('lists the groups, omits « à vérifier » and « impossibles » when they are 0', () => {
    expect(countersLabel({ feasible: 3, toCheck: 1, impossible: 2 }, false)).toBe('3 possibles · 1 à vérifier · 2 impossibles');
    expect(countersLabel({ feasible: 1, toCheck: 0, impossible: 1 }, false)).toBe('1 possible · 1 impossible');
    expect(countersLabel({ feasible: 0, toCheck: 0, impossible: 0 }, false)).toBe('Aucune séance');
  });

  it('shows the hiding next to the number of impossible ones', () => {
    expect(countersLabel({ feasible: 3, toCheck: 1, impossible: 2 }, true)).toBe(
      '3 possibles · 1 à vérifier · 2 impossibles (masquées)',
    );
    expect(countersLabel({ feasible: 3, toCheck: 0, impossible: 1 }, true)).toBe('3 possibles · 1 impossible (masquée)');
  });

  it('the button counts the visible cards', () => {
    expect(viewButtonLabel(6)).toBe('Voir 6 séances');
    expect(viewButtonLabel(1)).toBe('Voir 1 séance');
    expect(viewButtonLabel(0)).toBe('Voir 0 séance');
    const hidden = compute({ day: SATURDAY, hideImpossible: true });
    expect(viewButtonLabel(hidden.visible.length)).toBe('Voir 4 séances');
  });
});

describe('missing data in a result', () => {
  const venueWithoutTravel: Venue = { id: 'x', name: 'Salle X', district: 'Paris 1er', address: '1 rue de Test', travelEstimates: {} };
  const withoutDuration: Play = { ...(DEMO_PLAYS[0] as Play), id: 'sans-duree', venueId: 'x', announcedDurations: [] };

  it('a venue without travel estimate for this departure gives \'unknown-travel\', counted as to check', () => {
    const r = buildResults([withoutDuration], [venueWithoutTravel], criteria());
    expect(r.visible[0]?.evaluation.status).toBe('unknown-travel');
    expect(r.counters.toCheck).toBe(1);
  });

  it('a play whose venue is unknown is a data error, clearly reported', () => {
    expect(() => buildResults([withoutDuration], [], criteria())).toThrow(/Unknown venue/);
  });
});
