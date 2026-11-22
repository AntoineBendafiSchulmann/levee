import { findVenue, findPerformance } from '../domain/performances';
import { formatTime, formatTimeRange, dayLongLabel } from '../domain/time';
import { pluralize } from '../domain/text';
import type { Venue, Play } from '../domain/types';
import { bookingTotal, FARE_LABEL_IN_SUMMARY, type Booking } from './bookingRules';

/** A booking ready to display: the same for the confirmation receipt and the « Mes billets » list. */
export interface BookingSummary {
  readonly reference: string;
  /** Play title. */
  readonly title: string;
  /** « Samedi 28 novembre · 20h00 ». */
  readonly when: string;
  /** « Théâtre de la Rotonde, 4 place de la Rotonde ». */
  readonly venue: string;
  /** « 2 places · plein tarif ». */
  readonly seats: string;
  /** « 58 € ». */
  readonly total: string;
}

export function formatAmount(euros: number): string {
  return `${String(euros)} €`;
}

export function whenLabel(day: string, startMinutes: number): string {
  return `${dayLongLabel(day)} · ${formatTime(startMinutes)}`;
}

export function venueLabel(venue: Venue): string {
  return `${venue.name}, ${venue.address}`;
}

export function endTimeLabel(end: { readonly min: number; readonly max: number } | null): string {
  return end === null ? 'inconnue' : formatTimeRange(end);
}

/** Describes a booking from the schedule; `undefined` if its performance no longer exists. */
export function summarizeBooking(
  booking: Booking,
  plays: readonly Play[],
  venues: readonly Venue[],
): BookingSummary | undefined {
  const found = findPerformance(plays, booking.performanceId);
  if (found === undefined) {
    return undefined;
  }
  const { play: play, performance: performance } = found;
  return {
    reference: booking.reference,
    title: play.title,
    when: whenLabel(performance.day, performance.startMinutes),
    venue: venueLabel(findVenue(venues, play)),
    seats: `${pluralize(booking.seatCount, 'place', 'places')} · ${FARE_LABEL_IN_SUMMARY[booking.fare]}`,
    total: formatAmount(bookingTotal(play, booking.fare, booking.seatCount)),
  };
}
