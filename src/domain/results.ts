import type { Evaluation } from './evaluation';
import { evaluateForCriteria, buildPerformanceId, findVenue } from './performances';
import { normalizeText, pluralize } from './text';
import type { OutingCriteria, Venue, Performance, Play } from './types';

/** A result is a performance: a play shown twice on the same day gives two results. */
export interface PerformanceResult {
  /** Stable and unique per performance: `play-day-start`. */
  readonly id: string;
  readonly play: Play;
  readonly venue: Venue;
  readonly performance: Performance;
  readonly evaluation: Evaluation;
}

export interface Counters {
  readonly feasible: number;
  readonly toCheck: number;
  readonly impossible: number;
}

export interface PerformanceBeforeDeparture {
  readonly id: string;
  readonly title: string;
  readonly startMinutes: number;
}

export interface Results {
  /** Performances shown, by start time. Impossible ones are absent when hidden. */
  readonly visible: readonly PerformanceResult[];
  /** Totals for all listed performances, hidden or not. */
  readonly counters: Counters;
  /** True when impossible performances exist and are hidden. */
  readonly impossibleHidden: boolean;
  /** Performances of the day that start before the departure time: neither evaluated nor listed. */
  readonly beforeDeparture: readonly PerformanceBeforeDeparture[];
}

/** The result of one specific performance: the same evaluation as on a results card, for the play page. */
export function performanceResult(play: Play, venue: Venue, performance: Performance, criteria: OutingCriteria): PerformanceResult {
  return {
    id: buildPerformanceId(play, performance),
    play,
    venue,
    performance,
    evaluation: evaluateForCriteria(play, venue, performance, criteria),
  };
}

function matches(play: Play, criteria: OutingCriteria): boolean {
  const genreOk =
    criteria.genres.length === 0 || play.genres.some((genre) => criteria.genres.includes(genre));
  const query = normalizeText(criteria.author);
  return genreOk && (query === '' || normalizeText(play.author).includes(query));
}

export function buildResults(
  plays: readonly Play[],
  venues: readonly Venue[],
  criteria: OutingCriteria,
): Results {
  const listed: PerformanceResult[] = [];
  const beforeDeparture: PerformanceBeforeDeparture[] = [];

  for (const play of plays.filter((candidate) => matches(candidate, criteria))) {
    const venue = findVenue(venues, play);
    for (const performance of play.performances.filter((performance) => performance.day === criteria.day)) {
      const id = buildPerformanceId(play, performance);
      if (performance.startMinutes < criteria.departureMinutes) {
        beforeDeparture.push({ id, title: play.title, startMinutes: performance.startMinutes });
        continue;
      }
      listed.push(performanceResult(play, venue, performance, criteria));
    }
  }

  const byTime = (a: { startMinutes: number; title: string }, b: { startMinutes: number; title: string }) =>
    a.startMinutes - b.startMinutes || a.title.localeCompare(b.title, 'fr');
  listed.sort((a, b) =>
    byTime(
      { startMinutes: a.performance.startMinutes, title: a.play.title },
      { startMinutes: b.performance.startMinutes, title: b.play.title },
    ),
  );
  beforeDeparture.sort(byTime);

  const countGroup = (group: Evaluation['group']) => listed.filter((r) => r.evaluation.group === group).length;
  const counters: Counters = {
    feasible: countGroup('feasible'),
    toCheck: countGroup('to-check'),
    impossible: countGroup('impossible'),
  };
  const impossibleHidden = criteria.hideImpossible && counters.impossible > 0;

  return {
    visible: criteria.hideImpossible ? listed.filter((r) => r.evaluation.group !== 'impossible') : listed,
    counters,
    impossibleHidden,
    beforeDeparture,
  };
}

/**
 * « 3 possibles · 1 à vérifier · 2 impossibles (masquées) ». Totals cover all listed performances;
 * when impossible ones are hidden, the label says so next to their count.
 */
export function countersLabel(counters: Counters, impossibleHidden: boolean): string {
  if (counters.feasible + counters.toCheck + counters.impossible === 0) {
    return 'Aucune séance';
  }
  const parts = [pluralize(counters.feasible, 'possible', 'possibles')];
  if (counters.toCheck > 0) {
    parts.push(`${String(counters.toCheck)} à vérifier`);
  }
  if (counters.impossible > 0) {
    const hidden = impossibleHidden ? (counters.impossible > 1 ? ' (masquées)' : ' (masquée)') : '';
    parts.push(`${pluralize(counters.impossible, 'impossible', 'impossibles')}${hidden}`);
  }
  return parts.join(' · ');
}

/** Label of the « Voir N séances » button: N is the number of cards actually visible. */
export function viewButtonLabel(visibleCount: number): string {
  return `Voir ${pluralize(visibleCount, 'séance', 'séances')}`;
}
