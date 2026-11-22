import { describe, expect, it } from 'vitest';

import { DEMO_PLAYS } from '../demo-data/plays.demo';
import type { SessionStore } from '../navigation/criteriaSessionStorage';
import type { Booking } from './bookingRules';
import { BOOKINGS_STORAGE_KEY, parseBookings, readBookings, writeBookings } from './bookingSessionStorage';

const EIGHT_PM = 'jeu-amour-hasard-2026-11-28-1200';
const FOUR_THIRTY_PM = 'jeu-amour-hasard-2026-11-28-990';
const ONE: Booking = { reference: 'LV-4N9', performanceId: EIGHT_PM, fare: 'full', seatCount: 2 };

/** What the previous version wrote, captured as-is from a tab's `sessionStorage` (two bookings). */
const LEGACY_PAYLOAD =
  '[{"reference":"LV-4L8","seanceId":"jeu-amour-hasard-2026-11-28-990","tarif":"plein","places":2},' +
  '{"reference":"LV-4N9","seanceId":"jeu-amour-hasard-2026-11-28-1200","tarif":"reduit","places":3}]';

/** An entry in the persisted format; `extra` overrides or adds fields to build invalid entries. */
const stored = (extra: Record<string, unknown> = {}) => ({ reference: 'LV-4N9', seanceId: EIGHT_PM, tarif: 'plein', places: 2, ...extra });

function memory(initial?: string): SessionStore & { value: () => string | null } {
  let value: string | null = initial ?? null;
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next;
    },
    value: () => value,
  };
}

describe('bookings kept in the tab', () => {
  it('a blank context starts empty', () => {
    expect(readBookings(memory(), DEMO_PLAYS)).toEqual([]);
    expect(readBookings(undefined, DEMO_PLAYS)).toEqual([]);
  });

  it('writes under a dedicated key and reads back the same bookings, including the 8 pm performance', () => {
    const storage = memory();
    const two: Booking[] = [{ reference: 'LV-4RW', performanceId: FOUR_THIRTY_PM, fare: 'reduced', seatCount: 6 }, ONE];
    writeBookings(storage, two);
    expect(BOOKINGS_STORAGE_KEY).toBe('levee:reservations');
    expect(readBookings(storage, DEMO_PLAYS)).toEqual(two);
  });

  it('inaccessible storage breaks nothing: empty read, write ignored', () => {
    const broken: SessionStore = {
      getItem: () => {
        throw new Error('accès refusé');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };
    expect(readBookings(broken, DEMO_PLAYS)).toEqual([]);
    expect(() => {
      writeBookings(broken, [ONE]);
    }).not.toThrow();
    expect(() => {
      writeBookings(undefined, [ONE]);
    }).not.toThrow();
  });

  it('unreadable or invalid content is ignored entirely', () => {
    const invalid: unknown[] = [
      'pas du json{',
      { reference: 'LV-1' },
      [null],
      [stored({ seanceId: 'inconnue-2026-11-28-1200' })],
      [stored({ tarif: 'gratuit' })],
      [stored({ tarif: 'full' })],
      [stored({ places: 0 })],
      [stored({ places: 7 })],
      [stored({ places: 1.5 })],
      [stored({ places: '2' })],
      [stored({ reference: 'lv-4n9' })],
      [stored({ reference: 42 })],
      [stored(), stored()],
      [stored(), stored({ reference: 'LV-4RW', places: 99 })],
    ];
    for (const content of invalid) {
      const raw = typeof content === 'string' ? content : JSON.stringify(content);
      expect(readBookings(memory(raw), DEMO_PLAYS)).toEqual([]);
    }
  });

  it('valid entries are accepted, extra fields are dropped', () => {
    expect(parseBookings([stored({ intrus: true })], DEMO_PLAYS)).toEqual([ONE]);
    expect(parseBookings([], DEMO_PLAYS)).toEqual([]);
  });
});

describe('persisted contract: the format saved before the identifiers were renamed', () => {
  it('reads back with the same performance, fare and quantity', () => {
    expect(readBookings(memory(LEGACY_PAYLOAD), DEMO_PLAYS)).toEqual([
      { reference: 'LV-4L8', performanceId: FOUR_THIRTY_PM, fare: 'full', seatCount: 2 },
      { reference: 'LV-4N9', performanceId: EIGHT_PM, fare: 'reduced', seatCount: 3 },
    ]);
  });

  it('rewrites byte for byte identically: no field or value changes', () => {
    const storage = memory();
    writeBookings(storage, readBookings(memory(LEGACY_PAYLOAD), DEMO_PLAYS));
    expect(storage.value()).toBe(LEGACY_PAYLOAD);
  });
});
