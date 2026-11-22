import type { GroupeSeance } from '../domaine/evaluation';
import type { FareId, Spectacle } from '../domaine/types';

/** Une réservation simulée porte de 1 à 6 places. */
export const MIN_SEAT_COUNT = 1;
export const MAX_SEAT_COUNT = 6;

/** Ce que le formulaire propose à chaque ouverture : deux places au plein tarif. */
export const INITIAL_FARE: FareId = 'full';
export const INITIAL_SEAT_COUNT = 2;

export const FARE_ORDER: readonly FareId[] = ['full', 'reduced'];

/** Libellé du tarif dans le formulaire (« Plein tarif », « Moins de 26 ans »). */
export const FARE_LABEL: Readonly<Record<FareId, string>> = {
  full: 'Plein tarif',
  reduced: 'Moins de 26 ans',
};

/** Libellé du tarif dans une ligne de réservation, après le nombre de places (« 2 places · plein tarif »). */
export const FARE_LABEL_IN_SUMMARY: Readonly<Record<FareId, string>> = {
  full: 'plein tarif',
  reduced: 'moins de 26 ans',
};

/**
 * Une réservation simulée. Elle ne garde que ce que l'utilisateur a choisi : la représentation exacte (son identifiant,
 * `spectacle-jour-début`), le tarif et le nombre de places. Titre, date, lieu et prix se déduisent de la programmation,
 * donc le reçu et « Mes billets » présentent toujours les mêmes informations.
 */
export interface Booking {
  /** Référence affichée, par exemple « LV-4N9 » ; unique parmi les réservations de l'onglet. */
  readonly reference: string;
  readonly performanceId: string;
  readonly fare: FareId;
  /** Nombre de places, de 1 à 6 : à ne pas confondre avec le nombre de réservations. */
  readonly seatCount: number;
}

export function isValidSeatCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= MIN_SEAT_COUNT && value <= MAX_SEAT_COUNT;
}

/** Le nombre de places reste entre 1 et 6 : une valeur hors bornes est ramenée à la borne la plus proche. */
export function clampSeatCount(seatCount: number): number {
  return Math.min(MAX_SEAT_COUNT, Math.max(MIN_SEAT_COUNT, seatCount));
}

export function unitPrice(play: Spectacle, fare: FareId): number {
  return play.fares[fare];
}

export function bookingTotal(play: Spectacle, fare: FareId, seatCount: number): number {
  return unitPrice(play, fare) * seatCount;
}

/** Référence de la maquette : `LV-` puis une valeur en base 36 qui dépend du rang et de l'heure de début. */
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
 * Ajoute une réservation en tête de liste (la plus récente d'abord). Une confirmation, une réservation : le nombre
 * de réservations augmente de un, quel que soit le nombre de places.
 */
export function addBooking(
  bookings: readonly Booking[],
  next: { readonly performanceId: string; readonly startMinutes: number; readonly fare: FareId; readonly seatCount: number },
): { readonly bookings: readonly Booking[]; readonly reference: string } {
  const reference = generateReference(bookings.length, next.startMinutes, new Set(bookings.map((b) => b.reference)));
  const booking: Booking = { reference, performanceId: next.performanceId, fare: next.fare, seatCount: next.seatCount };
  return { bookings: [booking, ...bookings], reference };
}

/** « Réserver cette séance » quand elle est à temps ; « Réserver malgré tout » pour toute autre séance (à vérifier ou impossible). */
export function bookActionLabel(group: GroupeSeance): string {
  return group === 'possible' ? 'Réserver cette séance' : 'Réserver malgré tout';
}
