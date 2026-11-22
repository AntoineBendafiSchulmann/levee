import type { PerformanceGroup, PerformanceStatus } from '../domain/evaluation';

/** Displayed label of a status: the same on the result cards and on the performance page. */
export const STATUS_LABEL: Readonly<Record<PerformanceStatus, string>> = {
  'on-time': 'À temps',
  'tight-arrival': 'Arrivée serrée',
  'uncertain-end': 'Fin incertaine',
  'unknown-duration': 'Durée inconnue',
  'unknown-travel': 'Trajet non estimé',
  'late-arrival': 'Commence avant votre arrivée',
  'ends-too-late': 'Finit après votre limite',
};

/** Text colour by group. */
export const GROUP_TEXT: Readonly<Record<PerformanceGroup, string>> = {
  feasible: 'text-ok',
  'to-check': 'text-attention',
  impossible: 'text-danger',
};

/** Background colour of the status dot by group. */
export const GROUP_DOT: Readonly<Record<PerformanceGroup, string>> = {
  feasible: 'bg-ok',
  'to-check': 'bg-attention',
  impossible: 'bg-danger',
};

/** Border colour of a message (verdict) by group. */
export const GROUP_BORDER: Readonly<Record<PerformanceGroup, string>> = {
  feasible: 'border-ok',
  'to-check': 'border-attention',
  impossible: 'border-danger',
};
