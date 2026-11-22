import type { PerformanceGroup } from '../domain/evaluation';
import type { FareId, Play } from '../domain/types';

/** A simulated booking has 1 to 6 seats. */
export const MIN_SEAT_COUNT = 1;
export const MAX_SEAT_COUNT = 6;

/** What the form offers each time it opens: two seats at full fare. */
export const INITIAL_FARE: FareId = 'full';
export const INITIAL_SEAT_COUNT = 2;

export const FARE_ORDER: readonly FareId[] = ['full', 'reduced'];

/** Fare label in the form (« Plein tarif », « Moins de 26 ans »). */
export const FARE_LABEL: Readonly<Record<FareId, string>> = {
  full: 'Plein tarif',
  reduced: 'Moins de 26 ans',
};

/** Fare label in a booking row, after the number of seats (« 2 places · plein tarif »). */
export const FARE_LABEL_IN_SUMMARY: Readonly<Record<FareId, string>> = {
  full: 'plein tarif',
  reduced: 'moins de 26 ans',
};

/**
 * A simulated booking. It keeps only what the user chose: the exact performance (its id,
 * `play-day-start`), the fare and the number of seats. Title, date, venue and price are derived from the schedule,
 * so the receipt and « Mes billets » always show the same information.
 */
export interface Booking {
  /** Displayed reference, for example « LV-4N9 »; unique among the tab's bookings. */
  readonly reference: string;
  readonly performanceId: string;
  readonly fare: FareId;
  /** Number of seats, 1 to 6: not to be confused with the number of bookings. */
  readonly seatCount: number;
}

export function isValidSeatCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= MIN_SEAT_COUNT && value <= MAX_SEAT_COUNT;
}

/** The number of seats stays between 1 and 6: an out-of-range value is brought back to the nearest bound. */
export function clampSeatCount(seatCount: number): number {
  return Math.min(MAX_SEAT_COUNT, Math.max(MIN_SEAT_COUNT, seatCount));
}

export function unitPrice(play: Play, fare: FareId): number {
  return play.fares[fare];
}

export function bookingTotal(play: Play, fare: FareId, seatCount: number): number {
  return unitPrice(play, fare) * seatCount;
}

/** Mock-up reference: `LV-` then a base-36 value that depends on the rank and the start time. */
export function generateReference(rank: number, startMinutes: number, usedReferences: ReadonlySet<string>): string {
  let value = 4821 + rank * 137 + startMinutes;
  let reference = `LV-${value.toString(36).toUpperCase()}`;
  while (usedReferences.has(reference)) {
    value += 1;
    reference = `LV-${value.toString(36).toUpperCase()}`;
  }
  return reference;
}

/**
 * Adds a booking at the head of the list (most recent first). One confirmation, one booking: the number
 * of bookings increases by one, whatever the number of seats.
 */
export function addBooking(
  bookings: readonly Booking[],
  next: { readonly performanceId: string; readonly startMinutes: number; readonly fare: FareId; readonly seatCount: number },
): { readonly bookings: readonly Booking[]; readonly reference: string } {
  const reference = generateReference(bookings.length, next.startMinutes, new Set(bookings.map((b) => b.reference)));
  const booking: Booking = { reference, performanceId: next.performanceId, fare: next.fare, seatCount: next.seatCount };
  return { bookings: [booking, ...bookings], reference };
}

/** « Réserver cette séance » when it is on time; « Réserver malgré tout » for any other performance (to check or impossible). */
export function bookActionLabel(group: PerformanceGroup): string {
  return group === 'feasible' ? 'Réserver cette séance' : 'Réserver malgré tout';
}
