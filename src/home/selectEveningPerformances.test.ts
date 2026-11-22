import { describe, expect, it } from 'vitest';

import { DEMO_INITIAL_CRITERIA } from '../demo-data/criteria.demo';
import { DEMO_VENUES } from '../demo-data/venues.demo';
import { DEMO_PLAYS } from '../demo-data/plays.demo';
import { buildResults } from '../domain/results';
import { buildPerformanceId } from '../domain/performances';
import type { OutingCriteria, Play } from '../domain/types';
import { EVENING_PERFORMANCES_MAX, selectEveningPerformances } from './selectEveningPerformances';

const criteria = (overrides: Partial<OutingCriteria> = {}): OutingCriteria => ({ ...DEMO_INITIAL_CRITERIA, ...overrides });
const eveningPerformances = (overrides: Partial<OutingCriteria> = {}, plays: readonly Play[] = DEMO_PLAYS) =>
  selectEveningPerformances(buildResults(plays, DEMO_VENUES, criteria(overrides)));

describe('evening performances under the home page', () => {
  it('Thursday 26, République 18h30, limit 22h00: three possible performances, in results order', () => {
    const chosen = eveningPerformances();
    expect(chosen).toHaveLength(EVENING_PERFORMANCES_MAX);
    expect(chosen.map((r) => `${r.play.title} ${String(r.performance.startMinutes)}`)).toEqual([
      'Huis clos 1155',
      'L’Avare 1200',
      'Le Misanthrope 1200',
    ]);
    expect(chosen.every((r) => r.evaluation.group === 'feasible')).toBe(true);
  });

  it('keeps only possible performances: a performance to check or impossible is not included', () => {
    const all = buildResults(DEMO_PLAYS, DEMO_VENUES, criteria());
    expect(all.visible.some((r) => r.evaluation.group !== 'feasible')).toBe(true);
    expect(selectEveningPerformances(all).every((r) => r.evaluation.group === 'feasible')).toBe(true);
  });

  it('follows the criteria: Saturday 28 from 16h00, the Jeu 16h30 performance comes first', () => {
    const [first] = eveningPerformances({ day: '2026-11-28', departureMinutes: 960 });
    expect(first?.play.id).toBe('jeu-amour-hasard');
    expect(first?.performance.startMinutes).toBe(990);
  });

  it('a play performed twice on the same day gives two entries, each with its performance identifier', () => {
    const jeu = DEMO_PLAYS.find((s) => s.id === 'jeu-amour-hasard');
    if (jeu === undefined) {
      throw new Error('Demo play not found.');
    }
    const entries = eveningPerformances({ day: '2026-11-28', departureMinutes: 960 }, [jeu]);
    expect(entries.map((r) => r.id)).toEqual([
      buildPerformanceId(jeu, { day: '2026-11-28', startMinutes: 990 }),
      buildPerformanceId(jeu, { day: '2026-11-28', startMinutes: 1200 }),
    ]);
  });

  it('« Arrivée serrée » is to check, not possible: excluded from the evening performances as from the « possibles » counter', () => {
    // Saturday 28, departure 16h05: arrival at Jeu at 16h23 for 16h30, i.e. 7 min margin (threshold: 10 min).
    const c = criteria({ day: '2026-11-28', departureMinutes: 965 });
    const results = buildResults(DEMO_PLAYS, DEMO_VENUES, c);
    const tight = results.visible.find((r) => r.play.id === 'jeu-amour-hasard' && r.performance.startMinutes === 990);
    expect(tight?.evaluation.status).toBe('tight-arrival');
    expect(tight?.evaluation.group).toBe('to-check');
    expect(results.counters.feasible).toBe(results.visible.filter((r) => r.evaluation.group === 'feasible').length);
    expect(selectEveningPerformances(results).map((r) => r.id)).not.toContain(tight?.id);
    expect(selectEveningPerformances(results)).toHaveLength(EVENING_PERFORMANCES_MAX);
  });

  it('no compatible performance: no evening performance', () => {
    expect(eveningPerformances({ departureMinutes: 1260, exitLimitMinutes: 1200 })).toEqual([]);
  });
});
