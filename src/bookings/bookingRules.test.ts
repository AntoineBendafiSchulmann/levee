import { describe, expect, it } from 'vitest';

import { DEMO_PLAYS } from '../demo-data/plays.demo';
import {
  addBooking,
  clampSeatCount,
  generateReference,
  bookActionLabel,
  INITIAL_SEAT_COUNT,
  MAX_SEAT_COUNT,
  MIN_SEAT_COUNT,
  isValidSeatCount,
  INITIAL_FARE,
  bookingTotal,
  type Booking,
} from './bookingRules';

const play = (id: string) => {
  const found = DEMO_PLAYS.find((s) => s.id === id);
  if (found === undefined) {
    throw new Error(`Play ${id} not found.`);
  }
  return found;
};

describe('fares specific to each play (mock-up export)', () => {
  it.each([
    ['misanthrope', 32, 18],
    ['vasseur', 26, 15],
    ['jeu-amour-hasard', 29, 16],
    ['avare', 35, 20],
    ['cyrano', 38, 22],
    ['cle-sous-la-porte', 24, 14],
    ['huis-clos', 24, 14],
  ])('%s: full %i €, under 26 %i €', (id, full, reduced) => {
    expect(play(id).fares).toEqual({ full, reduced });
  });

  it('the form restarts from full fare and two seats', () => {
    expect(INITIAL_FARE).toBe('full');
    expect(INITIAL_SEAT_COUNT).toBe(2);
  });

  it('two seats at full fare for Le Jeu de l’amour et du hasard: 58 €', () => {
    expect(bookingTotal(play('jeu-amour-hasard'), 'full', 2)).toBe(58);
  });

  it('reduced fare and quantity change the total: 3 × 16 € = 48 €', () => {
    expect(bookingTotal(play('jeu-amour-hasard'), 'reduced', 3)).toBe(48);
    expect(bookingTotal(play('misanthrope'), 'full', MAX_SEAT_COUNT)).toBe(192);
  });
});

describe('number of seats: 1 to 6', () => {
  it('clampSeatCount stays within bounds', () => {
    expect([clampSeatCount(0), clampSeatCount(1), clampSeatCount(6), clampSeatCount(7), clampSeatCount(-3)]).toEqual([1, 1, 6, 6, 1]);
    expect([MIN_SEAT_COUNT, MAX_SEAT_COUNT]).toEqual([1, 6]);
  });

  it('only integers from 1 to 6 are valid', () => {
    expect([0, 1, 6, 7, 1.5, Number.NaN, '2', null].map(isValidSeatCount)).toEqual([false, true, true, false, false, false, false, false]);
  });
});

describe('booking reference', () => {
  it('follows the mock-up formula: LV- then (4821 + rank × 137 + start) in base 36', () => {
    expect(generateReference(0, 1200, new Set())).toBe('LV-4N9');
    expect(generateReference(1, 1200, new Set())).toBe('LV-4R2');
  });

  it('a reference already taken is shifted: never two bookings with the same one', () => {
    expect(generateReference(0, 1200, new Set(['LV-4N9']))).toBe('LV-4NA');
  });
});

describe('adding a booking', () => {
  const first = { performanceId: 'jeu-amour-hasard-2026-11-28-1200', startMinutes: 1200, fare: 'full', seatCount: 2 } as const;

  it('a confirmation creates a single booking, at the head of the list', () => {
    const { bookings, reference } = addBooking([], first);
    expect(bookings).toEqual([{ reference, performanceId: first.performanceId, fare: 'full', seatCount: 2 }]);
  });

  it('the counter counts bookings, not seats', () => {
    const one = addBooking([], first).bookings;
    const two = addBooking(one, { performanceId: 'cyrano-2026-11-28-1200', startMinutes: 1200, fare: 'reduced', seatCount: 6 });
    expect(two.bookings).toHaveLength(2);
    expect(two.bookings.reduce((sum, b: Booking) => sum + b.seatCount, 0)).toBe(8);
    expect(two.bookings[0]?.reference).toBe(two.reference);
    expect(new Set(two.bookings.map((b) => b.reference)).size).toBe(2);
  });
});

describe('booking action by status', () => {
  it('« à temps »: Réserver cette séance; to check or impossible: Réserver malgré tout', () => {
    expect(bookActionLabel('feasible')).toBe('Réserver cette séance');
    expect(bookActionLabel('to-check')).toBe('Réserver malgré tout');
    expect(bookActionLabel('impossible')).toBe('Réserver malgré tout');
  });
});
