import type { IsoDay, Performance, Play } from './types';

/** First performance of the play on that day or later, or `undefined` if none remain. */
export function nextPerformance(play: Play, day: IsoDay): Performance | undefined {
  return play.performances
    .filter((performance) => performance.day >= day)
    .sort((a, b) => a.day.localeCompare(b.day) || a.startMinutes - b.startMinutes)[0];
}

/** Days with at least one scheduled performance, in chronological order. */
export function availableDays(plays: readonly Play[]): IsoDay[] {
  return [...new Set(plays.flatMap((play) => play.performances.map((performance) => performance.day)))].sort();
}
