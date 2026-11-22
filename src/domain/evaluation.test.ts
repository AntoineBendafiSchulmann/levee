import { describe, expect, it } from 'vitest';

import { evaluatePerformance, TIGHT_ARRIVAL_THRESHOLD_MINUTES, type EvaluationInput, type PerformanceStatus } from './evaluation';

/** Departure 18:30, limit 22:00, 14 min travel: arrival 18:44. The start time and durations vary. */
function evaluate(overrides: Partial<EvaluationInput> = {}) {
  return evaluatePerformance({
    startMinutes: 19 * 60 + 30,
    announcedDurations: [{ minutes: 110, source: 'Théâtre' }],
    travelEstimate: { minutes: 14 },
    departureMinutes: 18 * 60 + 30,
    exitLimitMinutes: 22 * 60,
    ...overrides,
  });
}

describe('reachable performance', () => {
  it('computes the estimated arrival, the margin and the end from the announced values', () => {
    const e = evaluate();
    expect(e.status).toBe('on-time');
    expect(e.group).toBe('feasible');
    expect(e.travelMinutes).toBe(14);
    expect(e.arrivalMinutes).toBe(18 * 60 + 44);
    expect(e.arrivalMarginMinutes).toBe(46);
    expect(e.end).toEqual({ min: 21 * 60 + 20, max: 21 * 60 + 20 });
  });
});

describe('arrival relative to the start (estimated arrival 18:44)', () => {
  it.each<[string, number, PerformanceStatus]>([
    ['1 minute after the start', 18 * 60 + 43, 'late-arrival'],
    ['right at the start: 0 minute margin', 18 * 60 + 44, 'tight-arrival'],
    ['1 minute margin', 18 * 60 + 45, 'tight-arrival'],
    ['9 minute margin: below the threshold', 18 * 60 + 53, 'tight-arrival'],
    ['exactly 10 minute margin: the qualifier disappears', 18 * 60 + 54, 'on-time'],
    ['11 minute margin', 18 * 60 + 55, 'on-time'],
  ])('%s', (_, startMinutes, expected) => {
    expect(evaluate({ startMinutes }).status).toBe(expected);
  });

  it('classifies a late arrival as impossible, with the actual negative margin', () => {
    const e = evaluate({ startMinutes: 18 * 60 + 35 });
    expect(e.group).toBe('impossible');
    expect(e.arrivalMarginMinutes).toBe(-9);
  });

  it('relies on a named constant for the threshold', () => {
    expect(TIGHT_ARRIVAL_THRESHOLD_MINUTES).toBe(10);
  });
});

describe('exit relative to the limit (22:00 = 1320)', () => {
  // Start 19:30 (1170) + 110 min = end at 1280: the limit is placed exactly on the end.
  it('end exactly at the limit: compatible', () => {
    const e = evaluate({ exitLimitMinutes: 1280 });
    expect(e.end).toEqual({ min: 1280, max: 1280 });
    expect(e.status).toBe('on-time');
  });

  it('end one minute after the limit: impossible', () => {
    const e = evaluate({ exitLimitMinutes: 1279 });
    expect(e.status).toBe('ends-too-late');
    expect(e.group).toBe('impossible');
  });

  it('end well after the limit (Cyrano, 22:45 for 22:00): impossible', () => {
    expect(evaluate({ startMinutes: 1200, announcedDurations: [{ minutes: 165, source: 'Théâtre' }] }).status).toBe('ends-too-late');
  });
});

describe('two announced durations: 21:45–21:55 range (start 20:00, 105 or 115 min)', () => {
  const announcedDurations = [
    { minutes: 105, source: 'Site du théâtre' },
    { minutes: 115, source: 'Billetterie partenaire' },
  ];
  const evaluateWithLimit = (exitLimitMinutes: number) => evaluate({ startMinutes: 1200, announcedDurations, exitLimitMinutes });

  it('gives an end range', () => {
    expect(evaluateWithLimit(1320).end).toEqual({ min: 1305, max: 1315 });
  });

  it.each<[string, number, PerformanceStatus]>([
    ['limit 22:00: both durations fit', 1320, 'on-time'],
    ['limit 21:55, equal to the longest end: compatible', 1315, 'on-time'],
    ['limit 21:50, between the two: uncertain', 1310, 'uncertain-end'],
    ['limit 21:45, equal to the shortest end only: remains uncertain', 1305, 'uncertain-end'],
    ['limit 21:44, even the short duration exceeds it: impossible', 1304, 'ends-too-late'],
  ])('%s', (_, limit, expected) => {
    expect(evaluateWithLimit(limit).status).toBe(expected);
  });

  it('files the uncertainty under performances to check', () => {
    expect(evaluateWithLimit(1310).group).toBe('to-check');
  });

  it('two sources announcing the same duration do not make a range', () => {
    const e = evaluate({
      announcedDurations: [
        { minutes: 110, source: 'Théâtre' },
        { minutes: 110, source: 'Billetterie' },
      ],
    });
    expect(e.end?.min).toBe(e.end?.max);
    expect(e.status).toBe('on-time');
  });
});

describe('missing data', () => {
  it('a missing duration stays unknown: the end cannot be computed', () => {
    const e = evaluate({ announcedDurations: [] });
    expect(e.status).toBe('unknown-duration');
    expect(e.group).toBe('to-check');
    expect(e.end).toBeNull();
  });

  it('a missing travel estimate prevents estimating the arrival', () => {
    const e = evaluate({ travelEstimate: undefined });
    expect(e.status).toBe('unknown-travel');
    expect(e.group).toBe('to-check');
    expect(e.arrivalMinutes).toBeNull();
    expect(e.arrivalMarginMinutes).toBeNull();
  });

  it('a missing travel estimate does not hide an end already past the limit, impossible whatever the travel', () => {
    expect(evaluate({ travelEstimate: undefined, exitLimitMinutes: 1279 }).status).toBe('ends-too-late');
  });

  // Missing travel combined with other uncertainties: the status stays 'unknown-travel' (to check),
  // the card says the rest in its text (see explanation.test.ts).
  it('missing travel and unknown duration: \'unknown-travel\', no computable end', () => {
    const e = evaluate({ travelEstimate: undefined, announcedDurations: [] });
    expect(e.status).toBe('unknown-travel');
    expect(e.group).toBe('to-check');
    expect(e.end).toBeNull();
  });

  it('missing travel and uncertain end: \'unknown-travel\', the end range is kept', () => {
    const e = evaluate({
      travelEstimate: undefined,
      startMinutes: 1200,
      exitLimitMinutes: 1310,
      announcedDurations: [
        { minutes: 105, source: 'a' },
        { minutes: 115, source: 'b' },
      ],
    });
    expect(e.status).toBe('unknown-travel');
    expect(e.end).toEqual({ min: 1305, max: 1315 });
  });

  it('missing travel and end exactly at the limit: \'unknown-travel\', not \'on-time\'', () => {
    const e = evaluate({ travelEstimate: undefined, exitLimitMinutes: 1280 });
    expect(e.end).toEqual({ min: 1280, max: 1280 });
    expect(e.status).toBe('unknown-travel');
  });
});

describe('priorities between cases', () => {
  it('a late arrival takes precedence over an unknown duration', () => {
    expect(evaluate({ startMinutes: 18 * 60 + 40, announcedDurations: [] }).status).toBe('late-arrival');
  });

  it('an unknown duration takes precedence over a tight arrival', () => {
    expect(evaluate({ startMinutes: 18 * 60 + 49, announcedDurations: [] }).status).toBe('unknown-duration');
  });

  it('an end past the limit takes precedence over a tight arrival', () => {
    expect(evaluate({ startMinutes: 18 * 60 + 49, exitLimitMinutes: 1000 }).status).toBe('ends-too-late');
  });

  it('an uncertain end takes precedence over a tight arrival', () => {
    const announcedDurations = [
      { minutes: 105, source: 'a' },
      { minutes: 115, source: 'b' },
    ];
    expect(evaluate({ startMinutes: 18 * 60 + 49, announcedDurations, exitLimitMinutes: 18 * 60 + 49 + 110 }).status).toBe('uncertain-end');
  });

  it('a late arrival takes precedence over an end past the limit', () => {
    expect(evaluate({ startMinutes: 18 * 60 + 40, exitLimitMinutes: 1000 }).status).toBe('late-arrival');
  });
});
