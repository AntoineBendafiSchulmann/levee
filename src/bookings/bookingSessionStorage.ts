import { findPerformance } from '../domain/performances';
import type { FareId, Play } from '../domain/types';
import type { SessionStore } from '../navigation/criteriaSessionStorage';
import { FARE_ORDER, isValidSeatCount, type Booking } from './bookingRules';

/** `sessionStorage` key: the simulated bookings, for the lifetime of the tab only. Persisted contract: does not change. */
export const BOOKINGS_STORAGE_KEY = 'levee:reservations';

/*
 * Format written to `sessionStorage`: `[{ reference, seanceId, tarif: 'plein' | 'reduit', places }]`. It does not change
 * with the code names, so that a booking saved before a rename reads back identically: this
 * file is the only place that knows these names.
 */
interface StoredBooking {
  readonly reference: string;
  readonly seanceId: string;
  readonly tarif: 'plein' | 'reduit';
  readonly places: number;
}

const STORED_FARE: Readonly<Record<FareId, StoredBooking['tarif']>> = { full: 'plein', reduced: 'reduit' };

function toStored(booking: Booking): StoredBooking {
  return {
    reference: booking.reference,
    seanceId: booking.performanceId,
    tarif: STORED_FARE[booking.fare],
    places: booking.seatCount,
  };
}

const REFERENCE_PATTERN = /^LV-[0-9A-Z]+$/;

/**
 * Readable JSON is not necessarily an acceptable list of bookings: it is not an array, an entry is not
 * an object, the performance does not exist in the schedule, the fare is unknown, the number of seats is outside
 * 1 to 6, the reference is malformed or repeated. Returns the list, or `null` if a single entry is rejected (never a
 * partial list).
 */
export function parseBookings(value: unknown, plays: readonly Play[]): Booking[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const references = new Set<string>();
  const bookings: Booking[] = [];
  for (const entry of value as unknown[]) {
    if (typeof entry !== 'object' || entry === null) {
      return null;
    }
    const { reference, seanceId, tarif, places } = entry as Record<string, unknown>;
    const fare = FARE_ORDER.find((id) => STORED_FARE[id] === tarif);
    if (
      typeof reference !== 'string' ||
      !REFERENCE_PATTERN.test(reference) ||
      references.has(reference) ||
      typeof seanceId !== 'string' ||
      findPerformance(plays, seanceId) === undefined ||
      fare === undefined ||
      !isValidSeatCount(places)
    ) {
      return null;
    }
    references.add(reference);
    bookings.push({ reference, performanceId: seanceId, fare, seatCount: places });
  }
  return bookings;
}

/** Tab bookings; empty list if nothing stored, unreadable, rejected by the schedule or storage inaccessible. */
export function readBookings(storage: SessionStore | undefined, plays: readonly Play[]): Booking[] {
  try {
    const raw = storage?.getItem(BOOKINGS_STORAGE_KEY) ?? null;
    return raw === null ? [] : (parseBookings(JSON.parse(raw) as unknown, plays) ?? []);
  } catch {
    return [];
  }
}

export function writeBookings(storage: SessionStore | undefined, bookings: readonly Booking[]): void {
  try {
    storage?.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings.map(toStored)));
  } catch {
    // Bookings stay in memory for this page session: only a reload forgets them.
  }
}
