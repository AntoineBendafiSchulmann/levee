import { trouverSalle, trouverSeance } from '../domaine/seance';
import { formaterHeure, formaterPlageHeures, libelleJourLong } from '../domaine/temps';
import { pluriel } from '../domaine/texte';
import type { Salle, Spectacle } from '../domaine/types';
import { bookingTotal, FARE_LABEL_IN_SUMMARY, type Booking } from './bookingRules';

/** Une réservation prête à être affichée : la même pour le reçu de confirmation et la liste « Mes billets ». */
export interface BookingSummary {
  readonly reference: string;
  /** Titre de la pièce. */
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
  return `${libelleJourLong(day)} · ${formaterHeure(startMinutes)}`;
}

export function venueLabel(venue: Salle): string {
  return `${venue.nom}, ${venue.adresse}`;
}

export function endTimeLabel(end: { readonly min: number; readonly max: number } | null): string {
  return end === null ? 'inconnue' : formaterPlageHeures(end);
}

/** Décrit une réservation d'après la programmation ; `undefined` si sa représentation n'existe plus. */
export function summarizeBooking(
  booking: Booking,
  plays: readonly Spectacle[],
  venues: readonly Salle[],
): BookingSummary | undefined {
  const found = trouverSeance(plays, booking.performanceId);
  if (found === undefined) {
    return undefined;
  }
  const { spectacle: play, seance: performance } = found;
  return {
    reference: booking.reference,
    title: play.titre,
    when: whenLabel(performance.jour, performance.debutMinutes),
    venue: venueLabel(trouverSalle(venues, play)),
    seats: `${pluriel(booking.seatCount, 'place', 'places')} · ${FARE_LABEL_IN_SUMMARY[booking.fare]}`,
    total: formatAmount(bookingTotal(play, booking.fare, booking.seatCount)),
  };
}
