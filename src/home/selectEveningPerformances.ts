import type { PerformanceResult, Results } from '../domain/results';

/** Maximum number of performances offered under the home page. */
export const EVENING_PERFORMANCES_MAX = 3;

/**
 * The performances that « fit the evening »: the first possible ones (on time) among the already computed
 * results, in their order (by start time, then by title). Two performances of the same play on the same day
 * are two entries, each with its own identifier.
 */
export function selectEveningPerformances(results: Results): PerformanceResult[] {
  return results.visible.filter((r) => r.evaluation.group === 'feasible').slice(0, EVENING_PERFORMANCES_MAX);
}
