import { describe, expect, it } from 'vitest';

import { DEMO_INITIAL_CRITERIA } from '../demo-data/criteria.demo';
import { DEMO_VENUES } from '../demo-data/venues.demo';
import { DEMO_PLAYS } from '../demo-data/plays.demo';
import { buildResults, performanceResult } from './results';
import { suggestPerformance, buildPerformanceId, resolvePlayPage, findVenue, findPerformance } from './performances';
import type { OutingCriteria, Play } from './types';

const SATURDAY = '2026-11-28';
const criteria = (overrides: Partial<OutingCriteria> = {}): OutingCriteria => ({ ...DEMO_INITIAL_CRITERIA, ...overrides });
const play = (id: string): Play => {
  const found = DEMO_PLAYS.find((s) => s.id === id);
  if (found === undefined) {
    throw new Error(`Play ${id} not found.`);
  }
  return found;
};
const LOVE_AND_CHANCE = play('jeu-amour-hasard');
const time = (h: number, m = 0) => h * 60 + m;

describe('performance id', () => {
  it('is unique: the two Saturday performances of Jeu each have their own', () => {
    const ids = LOVE_AND_CHANCE.performances.map((s) => buildPerformanceId(LOVE_AND_CHANCE, s));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(`jeu-amour-hasard-${SATURDAY}-${String(time(20))}`);
    expect(ids).toContain(`jeu-amour-hasard-${SATURDAY}-${String(time(16, 30))}`);
  });

  it('matches the results: the 20:00 card carries the id of the 20:00 performance', () => {
    const results = buildResults(DEMO_PLAYS, DEMO_VENUES, criteria({ day: SATURDAY, departureMinutes: time(16) }));
    const loveAndChance = results.visible.filter((r) => r.play.id === LOVE_AND_CHANCE.id);
    expect(loveAndChance.map((r) => r.id)).toEqual([
      buildPerformanceId(LOVE_AND_CHANCE, { day: SATURDAY, startMinutes: time(16, 30) }),
      buildPerformanceId(LOVE_AND_CHANCE, { day: SATURDAY, startMinutes: time(20) }),
    ]);
  });

  it('finds the exact performance, whatever the other performance of the day', () => {
    const found = findPerformance(DEMO_PLAYS, buildPerformanceId(LOVE_AND_CHANCE, { day: SATURDAY, startMinutes: time(20) }));
    expect(found?.play.id).toBe(LOVE_AND_CHANCE.id);
    expect(found?.performance).toEqual({ day: SATURDAY, startMinutes: time(20) });
  });

  it('finds nothing for an unknown id or for a time that does not exist', () => {
    expect(findPerformance(DEMO_PLAYS, 'inconnu-2026-11-28-1200')).toBeUndefined();
    expect(findPerformance(DEMO_PLAYS, `jeu-amour-hasard-${SATURDAY}-1201`)).toBeUndefined();
  });
});

describe('performance preselected when a play is opened', () => {
  const venue = findVenue(DEMO_VENUES, LOVE_AND_CHANCE);
  const choice = (overrides: Partial<OutingCriteria>) => suggestPerformance(LOVE_AND_CHANCE, venue, criteria(overrides))?.startMinutes;

  it('Saturday, departure 16:00: 16:30 (the first that fits)', () => {
    expect(choice({ day: SATURDAY, departureMinutes: time(16) })).toBe(time(16, 30));
  });

  it('Saturday, departure 18:30: 20:00, the 16:30 performance has started', () => {
    expect(choice({ day: SATURDAY, departureMinutes: time(18, 30) })).toBe(time(20));
  });

  it('prefers a « possible » performance over one that is only to check', () => {
    // Uncertain end at 20:00 with a 21:50 limit, but 16:30 ends at 18:15: it fits.
    expect(choice({ day: SATURDAY, departureMinutes: time(16), exitLimitMinutes: time(21, 50) })).toBe(time(16, 30));
    // Departure 18:30: only 20:00 remains, it is chosen even if its end is uncertain.
    expect(choice({ day: SATURDAY, departureMinutes: time(18, 30), exitLimitMinutes: time(21, 50) })).toBe(time(20));
  });

  it('day without performances: the next performance after that day, otherwise the first of the play', () => {
    const vasseur = play('vasseur');
    const vasseurVenue = findVenue(DEMO_VENUES, vasseur);
    expect(suggestPerformance(vasseur, vasseurVenue, criteria({ day: '2026-11-25' }))).toEqual({ day: '2026-11-26', startMinutes: 1140 });
    // Sunday: no more performances of this play; the play page can still be opened on its first performance.
    expect(suggestPerformance(vasseur, vasseurVenue, criteria({ day: '2026-11-29' }))).toEqual({ day: '2026-11-26', startMinutes: 1140 });
  });

  it('all performances of the day before departure: the first of the day', () => {
    expect(choice({ day: SATURDAY, departureMinutes: time(23) })).toBe(time(16, 30));
  });

  it('the time shown on the poster is the one on the play page (same rule) for all departures and all days', () => {
    for (const day of ['2026-11-26', '2026-11-27', SATURDAY, '2026-11-29']) {
      for (const departureMinutes of [time(14), time(16), time(18, 30), time(21)]) {
        for (const demoPlay of DEMO_PLAYS) {
          const expected = suggestPerformance(demoPlay, findVenue(DEMO_VENUES, demoPlay), criteria({ day, departureMinutes }));
          const playPage = resolvePlayPage(DEMO_PLAYS, DEMO_VENUES, { type: 'play', id: demoPlay.id }, criteria({ day, departureMinutes }));
          expect(playPage?.performance).toEqual(expected);
        }
      }
    }
  });
});

describe('resolving a play page address', () => {
  it('/seances/:id keeps the requested performance even if the criteria would prefer another', () => {
    const id = buildPerformanceId(LOVE_AND_CHANCE, { day: SATURDAY, startMinutes: time(20) });
    const playPage = resolvePlayPage(DEMO_PLAYS, DEMO_VENUES, { type: 'performance', id }, criteria({ day: SATURDAY, departureMinutes: time(16) }));
    expect(playPage?.performance.startMinutes).toBe(time(20));
    expect(playPage?.venue.id).toBe('rotonde');
  });

  it('an unknown play or performance gives no play page', () => {
    expect(resolvePlayPage(DEMO_PLAYS, DEMO_VENUES, { type: 'play', id: 'inconnue' }, criteria())).toBeUndefined();
    expect(resolvePlayPage(DEMO_PLAYS, DEMO_VENUES, { type: 'performance', id: 'inconnue' }, criteria())).toBeUndefined();
  });
});

describe('play page: Saturday 28 November, 20:00 Jeu', () => {
  const venue = findVenue(DEMO_VENUES, LOVE_AND_CHANCE);
  const performance = { day: SATURDAY, startMinutes: time(20) };

  it('limit 22:00: on time; limit 21:50: uncertain end (21:45–21:55)', () => {
    expect(performanceResult(LOVE_AND_CHANCE, venue, performance, criteria({ day: SATURDAY })).evaluation.status).toBe('on-time');
    const uncertain = performanceResult(LOVE_AND_CHANCE, venue, performance, criteria({ day: SATURDAY, exitLimitMinutes: time(21, 50) })).evaluation;
    expect(uncertain.status).toBe('uncertain-end');
    expect(uncertain.end).toEqual({ min: time(21, 45), max: time(21, 55) });
  });

  it('the play page status is that of the results card', () => {
    const c = criteria({ day: SATURDAY, exitLimitMinutes: time(21, 50) });
    const card = buildResults(DEMO_PLAYS, DEMO_VENUES, c).visible.find((r) => r.id === buildPerformanceId(LOVE_AND_CHANCE, performance));
    expect(card?.evaluation).toEqual(performanceResult(LOVE_AND_CHANCE, venue, performance, c).evaluation);
  });
});
