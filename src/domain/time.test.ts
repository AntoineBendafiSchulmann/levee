import { describe, expect, it } from 'vitest';

import { distinctDurations, formatDistance, formatDuration, formatTimeRange, formatTime, dayBriefLabel, dayShortLabel, dayPhrase, dayLongLabel, minutesLabel } from './time';

describe('time', () => {
  it('formats times and durations', () => {
    expect(formatTime(1320)).toBe('22h00');
    expect(formatTime(1215)).toBe('20h15');
    expect(formatDuration(110)).toBe('1 h 50');
    expect(formatDuration(60)).toBe('1 h 00');
    expect(formatDuration(45)).toBe('45 min');
    expect(minutesLabel(105)).toBe('105 min');
  });

  it('formats days independently of the time zone', () => {
    expect(dayLongLabel('2026-11-26')).toBe('Jeudi 26 novembre');
    expect(dayShortLabel('2026-11-26', '2026-11-26')).toBe('Ce soir');
    expect(dayShortLabel('2026-11-28', '2026-11-26')).toBe('Sam. 28');
    expect(dayPhrase('2026-11-26', '2026-11-26')).toBe('ce soir');
    expect(dayPhrase('2026-11-28', '2026-11-26')).toBe('samedi');
  });

  it('rejects a malformed day', () => {
    expect(() => dayLongLabel('28/11/2026')).toThrow(/Invalid day/);
  });
});

describe('day and distance labels', () => {
  it('formats the abbreviated day and the distance', () => {
    expect(dayBriefLabel('2026-11-28')).toBe('sam. 28 nov.');
    expect(formatDistance(0.35)).toBe('350 m');
    expect(formatDistance(2.4)).toBe('2,4 km');
    expect(formatDistance(3)).toBe('3,0 km');
  });
});

describe('end range and distinct durations', () => {
  it('certain end: one time; two announced durations: a range', () => {
    expect(formatTimeRange({ min: 1310, max: 1310 })).toBe('21h50');
    expect(formatTimeRange({ min: 1305, max: 1315 })).toBe('21h45–21h55');
  });

  it('distinct durations: no duplicates, shortest to longest, empty if none is announced', () => {
    expect(distinctDurations([])).toEqual([]);
    expect(
      distinctDurations([
        { minutes: 115, source: 'Billetterie partenaire' },
        { minutes: 105, source: 'Site du théâtre' },
        { minutes: 115, source: 'Autre source' },
      ]),
    ).toEqual([105, 115]);
  });
});
