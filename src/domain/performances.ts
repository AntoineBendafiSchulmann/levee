import { evaluatePerformance, type Evaluation } from './evaluation';
import { nextPerformance } from './schedule';
import type { OutingCriteria, Venue, Performance, Play } from './types';

/** Stable, unique id of a performance: `play-day-start`. It is the one used in `/seances/:id` URLs. */
export function buildPerformanceId(play: Play, performance: Performance): string {
  return `${play.id}-${performance.day}-${String(performance.startMinutes)}`;
}

/** Evaluates a performance against the outing criteria (departure time, departure point, exit limit); the criteria day plays no part. */
export function evaluateForCriteria(play: Play, venue: Venue, performance: Performance, criteria: OutingCriteria): Evaluation {
  return evaluatePerformance({
    startMinutes: performance.startMinutes,
    announcedDurations: play.announcedDurations,
    travelEstimate: venue.travelEstimates[criteria.departurePointId],
    departureMinutes: criteria.departureMinutes,
    exitLimitMinutes: criteria.exitLimitMinutes,
  });
}

export function findVenue(venues: readonly Venue[], play: Play): Venue {
  const venue = venues.find((candidate) => candidate.id === play.venueId);
  if (venue === undefined) {
    throw new Error(`Unknown venue « ${play.venueId} » for play « ${play.id} ».`);
  }
  return venue;
}

export interface FoundPerformance {
  readonly play: Play;
  readonly performance: Performance;
}

/** Finds a performance by its exact id; `undefined` if none matches. */
export function findPerformance(plays: readonly Play[], id: string): FoundPerformance | undefined {
  for (const play of plays) {
    const performance = play.performances.find((candidate) => buildPerformanceId(play, candidate) === id);
    if (performance !== undefined) {
      return { play, performance };
    }
  }
  return undefined;
}

/**
 * Performance preselected when a play is opened without a chosen time (home poster).
 * Same rule as the mockup: among the chosen day's performances starting at or after departure,
 * the first suitable one (« possible » group), otherwise the first one; failing that, the first
 * performance of the day; failing that, the next performance after that day, then the very first.
 * `undefined` only if the play has no performance.
 */
export function suggestPerformance(play: Play, venue: Venue, criteria: OutingCriteria): Performance | undefined {
  const byTime = (a: Performance, b: Performance) => a.day.localeCompare(b.day) || a.startMinutes - b.startMinutes;
  const onSelectedDay = play.performances.filter((performance) => performance.day === criteria.day).sort(byTime);
  const startingAfterDeparture = onSelectedDay.filter((performance) => performance.startMinutes >= criteria.departureMinutes);
  const suitable = startingAfterDeparture.find((performance) => evaluateForCriteria(play, venue, performance, criteria).group === 'feasible');
  return (
    suitable ??
    startingAfterDeparture[0] ??
    onSelectedDay[0] ??
    nextPerformance(play, criteria.day) ??
    [...play.performances].sort(byTime)[0]
  );
}

export interface PlayPageResolution {
  readonly play: Play;
  readonly venue: Venue;
  readonly performance: Performance;
}

/** A play page address: either a play (performance to preselect) or a specific performance. */
export type PlayPageTarget = { readonly type: 'play' | 'performance'; readonly id: string };

/** Resolves a play page address; `undefined` if the play or performance does not exist. */
export function resolvePlayPage(
  plays: readonly Play[],
  venues: readonly Venue[],
  target: PlayPageTarget,
  criteria: OutingCriteria,
): PlayPageResolution | undefined {
  if (target.type === 'performance') {
    const found = findPerformance(plays, target.id);
    return found === undefined ? undefined : { ...found, venue: findVenue(venues, found.play) };
  }
  const play = plays.find((candidate) => candidate.id === target.id);
  if (play === undefined) {
    return undefined;
  }
  const venue = findVenue(venues, play);
  const performance = suggestPerformance(play, venue, criteria);
  return performance === undefined ? undefined : { play, venue, performance };
}
