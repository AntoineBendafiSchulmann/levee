import type { OutingCriteria, IsoDay } from '../domain/types';

/*
 * FICTITIOUS DATA — demo.
 * The « current day » is frozen: « ce soir » means Thursday 26 November 2026 here,
 * whatever the real date. To be replaced when the data comes from the BFF.
 */
export const DEMO_TODAY: IsoDay = '2026-11-26';

export const DEMO_INITIAL_CRITERIA: OutingCriteria = {
  day: DEMO_TODAY,
  departurePointId: 'republique',
  departureMinutes: 18 * 60 + 30,
  exitLimitMinutes: 22 * 60,
  genres: [],
  author: '',
  hideImpossible: false,
};

/** Shortcuts offered under the « Auteur » field. */
export const DEMO_SUGGESTED_AUTHORS: readonly string[] = ['Molière', 'Marivaux', 'Rostand'];
