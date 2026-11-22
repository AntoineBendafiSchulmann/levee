import type { AnnouncedDuration, TravelEstimate } from './types';

/**
 * An arrival less than this many minutes before the start is « serrée » (tight; 0 minutes included).
 * At exactly 10 minutes the qualifier goes away. V1 presentation choice.
 */
export const TIGHT_ARRIVAL_THRESHOLD_MINUTES = 10;

export type PerformanceStatus =
  | 'on-time'
  | 'tight-arrival'
  | 'uncertain-end'
  | 'unknown-duration'
  | 'unknown-travel'
  | 'late-arrival'
  | 'ends-too-late';

export type PerformanceGroup = 'feasible' | 'to-check' | 'impossible';

export const GROUP_BY_STATUS: Readonly<Record<PerformanceStatus, PerformanceGroup>> = {
  'on-time': 'feasible',
  'tight-arrival': 'to-check',
  'uncertain-end': 'to-check',
  'unknown-duration': 'to-check',
  'unknown-travel': 'to-check',
  'late-arrival': 'impossible',
  'ends-too-late': 'impossible',
};

export interface EvaluationInput {
  /** Announced start time. */
  readonly startMinutes: number;
  readonly announcedDurations: readonly AnnouncedDuration[];
  /** Estimated travel; `undefined` when no estimate exists for this departure point. */
  readonly travelEstimate: TravelEstimate | undefined;
  readonly departureMinutes: number;
  readonly exitLimitMinutes: number;
}

export interface Evaluation {
  readonly status: PerformanceStatus;
  readonly group: PerformanceGroup;
  /** Estimated travel. */
  readonly travelMinutes: number | null;
  /** Estimated arrival: departure + travel. */
  readonly arrivalMinutes: number | null;
  /** Announced start minus estimated arrival: negative when arriving after the start. */
  readonly arrivalMarginMinutes: number | null;
  /** Computed end: start + announced duration. Two different durations give a range. */
  readonly end: { readonly min: number; readonly max: number } | null;
}

/**
 * Classifies a performance. The first matching case wins:
 * arrival after the start, travel not estimated (unless the end already exceeds the limit), unknown duration,
 * end past the limit, uncertain end (only the short duration meets the limit), tight arrival, on time.
 * An end exactly at the limit is compatible.
 */
export function evaluatePerformance(input: EvaluationInput): Evaluation {
  const { startMinutes, announcedDurations, travelEstimate, departureMinutes, exitLimitMinutes } = input;
  const travelMinutes = travelEstimate?.minutes ?? null;
  const arrivalMinutes = travelMinutes === null ? null : departureMinutes + travelMinutes;
  const arrivalMarginMinutes = arrivalMinutes === null ? null : startMinutes - arrivalMinutes;
  const minutes = announcedDurations.map((duration) => duration.minutes);
  const end =
    minutes.length === 0
      ? null
      : { min: startMinutes + Math.min(...minutes), max: startMinutes + Math.max(...minutes) };

  let status: PerformanceStatus;
  if (arrivalMarginMinutes !== null && arrivalMarginMinutes < 0) {
    status = 'late-arrival';
  } else if (arrivalMarginMinutes === null) {
    status = end !== null && end.min > exitLimitMinutes ? 'ends-too-late' : 'unknown-travel';
  } else if (end === null) {
    status = 'unknown-duration';
  } else if (end.min > exitLimitMinutes) {
    status = 'ends-too-late';
  } else if (end.max > exitLimitMinutes) {
    status = 'uncertain-end';
  } else if (arrivalMarginMinutes < TIGHT_ARRIVAL_THRESHOLD_MINUTES) {
    status = 'tight-arrival';
  } else {
    status = 'on-time';
  }

  return {
    status,
    group: GROUP_BY_STATUS[status],
    travelMinutes,
    arrivalMinutes,
    arrivalMarginMinutes,
    end,
  };
}
