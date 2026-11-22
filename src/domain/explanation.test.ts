import { describe, expect, it } from 'vitest';

import { explainPerformance } from './explanation';
import { TWO_DURATIONS, resultFor, type Scenario } from './fixtures.test-utils';

const REF: Scenario = { announcedDurations: TWO_DURATIONS, startMinutes: 1200, exitLimitMinutes: 1310, withTravelEstimate: true };
const text = (scenario: Scenario) => {
  const { result, criteria } = resultFor(scenario);
  return explainPerformance(result, criteria, 'République');
};

const NO_TRAVEL_ESTIMATE = 'Aucun trajet n’est estimé depuis République : l’heure d’arrivée ne peut pas être calculée.';
const ANNOUNCED_DURATIONS =
  'Deux durées sont annoncées : 1 h 45 et 1 h 55. La séance peut finir entre 21h45 et 21h55. Votre limite est 21h50.';

describe('uncertain end', () => {
  it('reference case: announced durations, end range, limit', () => {
    expect(text(REF)).toBe(ANNOUNCED_DURATIONS);
  });

  it('more than two durations: enumeration and count are computed', () => {
    const announcedDurations = [100, 110, 120].map((minutes) => ({ minutes, source: 'x' }));
    expect(text({ ...REF, announcedDurations, exitLimitMinutes: 1310 })).toBe(
      '3 durées sont annoncées : 1 h 40, 1 h 50 et 2 h 00. La séance peut finir entre 21h40 et 22h00. Votre limite est 21h50.',
    );
  });

  it('no longer uses « selon la bonne »', () => {
    expect(text(REF)).not.toContain('selon la bonne');
  });
});

describe('travel not estimated: the text also says the rest', () => {
  const withoutTravel: Scenario = { ...REF, withTravelEstimate: false };

  it('unknown duration', () => {
    expect(text({ ...withoutTravel, announcedDurations: [] })).toBe(`${NO_TRAVEL_ESTIMATE} Durée non annoncée : la fin ne peut pas être calculée.`);
  });

  it('end range overlapping the limit', () => {
    expect(text(withoutTravel)).toBe(`${NO_TRAVEL_ESTIMATE} ${ANNOUNCED_DURATIONS}`);
  });

  it('range whose shortest end falls exactly on the limit: it still overlaps', () => {
    expect(text({ ...withoutTravel, exitLimitMinutes: 1305 })).toContain('La séance peut finir entre 21h45 et 21h55. Votre limite est 21h45.');
  });

  it('range whose longest end falls exactly on the limit: compatible, nothing to add', () => {
    expect(text({ ...withoutTravel, exitLimitMinutes: 1315 })).toBe(NO_TRAVEL_ESTIMATE);
  });

  it('range entirely before the limit: nothing to add', () => {
    expect(text({ ...withoutTravel, exitLimitMinutes: 1320 })).toBe(NO_TRAVEL_ESTIMATE);
  });

  it('end exactly at the limit: nothing to add', () => {
    const unique = [{ minutes: 110, source: 'Théâtre' }];
    expect(text({ announcedDurations: unique, startMinutes: 1170, exitLimitMinutes: 1280, withTravelEstimate: false })).toBe(NO_TRAVEL_ESTIMATE);
  });

  it('end certainly too late: impossible, with its own text', () => {
    const longest = [{ minutes: 165, source: 'Théâtre' }];
    expect(text({ announcedDurations: longest, startMinutes: 1200, exitLimitMinutes: 1320, withTravelEstimate: false })).toBe(
      'Fin calculée à 22h45, soit 45 min après votre limite.',
    );
  });
});

describe('other statuses', () => {
  it('an on-time performance has no sentence', () => {
    expect(text({ ...REF, exitLimitMinutes: 1320 })).toBeNull();
  });

  it('unknown duration with travel: what it would take to exit on time', () => {
    expect(text({ ...REF, announcedDurations: [] })).toBe(
      'Durée non annoncée : la fin ne peut pas être calculée. Il faudrait 1 h 50 au plus pour sortir au plus tard à 21h50.',
    );
  });
});
