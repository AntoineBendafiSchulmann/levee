import { DEMO_INITIAL_CRITERIA } from '../demo-data/criteria.demo';
import { DEMO_PLAYS } from '../demo-data/plays.demo';
import { buildResults, type PerformanceResult } from './results';
import type { OutingCriteria, AnnouncedDuration, Venue, Play } from './types';

const found = DEMO_PLAYS.find((play) => play.id === 'jeu-amour-hasard');
if (found === undefined) {
  throw new Error('Demo play not found.');
}
const TEMPLATE: Play = found;

export const TWO_DURATIONS: readonly AnnouncedDuration[] = [
  { minutes: 105, source: 'Site du théâtre' },
  { minutes: 115, source: 'Billetterie partenaire' },
];

export interface Scenario {
  readonly announcedDurations: readonly AnnouncedDuration[];
  /** Start of the Saturday 28 November performance, in minutes since midnight. */
  readonly startMinutes: number;
  readonly exitLimitMinutes: number;
  readonly withTravelEstimate: boolean;
}

export const SATURDAY_CRITERIA: OutingCriteria = { ...DEMO_INITIAL_CRITERIA, day: '2026-11-28' };

/** A performance result built for a specific case (departure République 18h30). */
export function resultFor(scenario: Scenario): { result: PerformanceResult; criteria: OutingCriteria } {
  const venue: Venue = {
    id: 'salle-x',
    name: 'Salle X',
    district: 'Paris 1er',
    address: '1 rue de Test',
    travelEstimates: scenario.withTravelEstimate ? { republique: { minutes: 18 } } : {},
  };
  const play: Play = {
    ...TEMPLATE,
    id: 'x',
    venueId: venue.id,
    announcedDurations: scenario.announcedDurations,
    performances: [{ day: '2026-11-28', startMinutes: scenario.startMinutes }],
  };
  const criteria = { ...SATURDAY_CRITERIA, exitLimitMinutes: scenario.exitLimitMinutes };
  const result = buildResults([play], [venue], criteria).visible[0];
  if (result === undefined) {
    throw new Error('No result for this scenario.');
  }
  return { result, criteria };
}
