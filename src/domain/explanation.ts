import type { PerformanceResult } from './results';
import { distinctDurations, formatDuration, formatTime, minutesLabel } from './time';
import type { OutingCriteria } from './types';

/** « a », « a et b », « a, b et c » (French list enumeration). */
function enumerate(elements: readonly string[]): string {
  if (elements.length <= 1) {
    return elements.join('');
  }
  return `${elements.slice(0, -1).join(', ')} et ${elements.at(-1) ?? ''}`;
}

/** Uncertain end: the announced durations, the resulting end range and the limit that falls within it. */
function uncertainEndPhrase(result: PerformanceResult, limit: string): string | null {
  const { end } = result.evaluation;
  if (end === null) {
    return null;
  }
  const distinctMinutes = distinctDurations(result.play.announcedDurations);
  const announcement = distinctMinutes.length === 2 ? 'Deux durées sont annoncées' : `${String(distinctMinutes.length)} durées sont annoncées`;
  return `${announcement} : ${enumerate(distinctMinutes.map(formatDuration))}. La séance peut finir entre ${formatTime(end.min)} et ${formatTime(end.max)}. Votre limite est ${limit}.`;
}

const UNKNOWN_DURATION_PHRASE = 'Durée non annoncée : la fin ne peut pas être calculée.';

/**
 * Explanation sentence under a card's times; `null` when the performance is simply « à temps ».
 * When travel is missing, the sentence also says whether the duration is unknown or the end range straddles
 * the limit: the « Trajet non estimé » status must not hide those uncertainties.
 */
export function explainPerformance(result: PerformanceResult, criteria: OutingCriteria, departurePointLabel: string): string | null {
  const { status, arrivalMarginMinutes: margin, arrivalMinutes: arrival, end } = result.evaluation;
  const limit = formatTime(criteria.exitLimitMinutes);
  switch (status) {
    case 'on-time':
      return null;
    case 'tight-arrival':
      return margin === 0
        ? 'Arrivée estimée à l’heure du début : aucune marge si le trajet s’allonge.'
        : `Arrivée estimée ${minutesLabel(margin ?? 0)} avant le début : marge courte si le trajet s’allonge.`;
    case 'uncertain-end':
      return uncertainEndPhrase(result, limit);
    case 'unknown-duration':
      return `${UNKNOWN_DURATION_PHRASE} Il faudrait ${formatDuration(
        Math.max(0, criteria.exitLimitMinutes - result.performance.startMinutes),
      )} au plus pour sortir au plus tard à ${limit}.`;
    case 'unknown-travel': {
      const base = `Aucun trajet n’est estimé depuis ${departurePointLabel} : l’heure d’arrivée ne peut pas être calculée.`;
      if (end === null) {
        return `${base} ${UNKNOWN_DURATION_PHRASE}`;
      }
      const straddles = end.min <= criteria.exitLimitMinutes && end.max > criteria.exitLimitMinutes;
      const uncertainty = straddles ? uncertainEndPhrase(result, limit) : null;
      return uncertainty === null ? base : `${base} ${uncertainty}`;
    }
    case 'late-arrival':
      return `Arrivée estimée à ${formatTime(arrival ?? 0)}, soit ${minutesLabel(-(margin ?? 0))} après le début.`;
    case 'ends-too-late':
      return end === null
        ? null
        : `Fin calculée à ${formatTime(end.min)}, soit ${minutesLabel(end.min - criteria.exitLimitMinutes)} après votre limite.`;
  }
}

/**
 * Verdict sentence of the play page: the card's explanation or, when the performance is « à temps »,
 * the margin at arrival and at exit (using the longest duration when two durations are announced).
 */
export function performanceVerdict(result: PerformanceResult, criteria: OutingCriteria, departurePointLabel: string): string {
  const { status, arrivalMarginMinutes: margin, end } = result.evaluation;
  if (status !== 'on-time' || margin === null || end === null) {
    return explainPerformance(result, criteria, departurePointLabel) ?? '';
  }
  const evenWithLongestDuration = distinctDurations(result.play.announcedDurations).length > 1 ? ' même avec la durée la plus longue' : '';
  return `Arrivée estimée ${minutesLabel(margin)} avant le début, sortie ${minutesLabel(criteria.exitLimitMinutes - end.max)} avant votre limite${evenWithLongestDuration}.`;
}
