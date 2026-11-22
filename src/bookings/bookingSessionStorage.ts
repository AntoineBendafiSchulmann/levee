import { trouverSeance } from '../domaine/seance';
import type { FareId, Spectacle } from '../domaine/types';
import type { Stockage } from '../parcours/stockageCriteres';
import { FARE_ORDER, isValidSeatCount, type Booking } from './bookingRules';

/** Clé du `sessionStorage` : les réservations simulées, pour la durée de l'onglet seulement. Contrat persisté : ne change pas. */
export const BOOKINGS_STORAGE_KEY = 'levee:reservations';

/*
 * Format écrit dans le `sessionStorage` : `[{ reference, seanceId, tarif: 'plein' | 'reduit', places }]`. Il ne change
 * pas avec les noms du code, pour qu'une réservation enregistrée avant un renommage se relise à l'identique : ce
 * fichier est le seul endroit qui connaît ces noms.
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
 * Un JSON lisible n'est pas forcément une liste de réservations acceptable : ce n'est pas un tableau, une entrée n'est
 * pas un objet, la représentation n'existe pas dans la programmation, le tarif est inconnu, le nombre de places sort de
 * 1 à 6, la référence est mal formée ou répétée. Renvoie la liste, ou `null` si une seule entrée est refusée (jamais de
 * liste partielle).
 */
export function parseBookings(value: unknown, plays: readonly Spectacle[]): Booking[] | null {
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
      trouverSeance(plays, seanceId) === undefined ||
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

/** Réservations de l'onglet ; liste vide si rien, illisible, refusé par la programmation ou stockage inaccessible. */
export function readBookings(storage: Stockage | undefined, plays: readonly Spectacle[]): Booking[] {
  try {
    const raw = storage?.getItem(BOOKINGS_STORAGE_KEY) ?? null;
    return raw === null ? [] : (parseBookings(JSON.parse(raw) as unknown, plays) ?? []);
  } catch {
    return [];
  }
}

export function writeBookings(storage: Stockage | undefined, bookings: readonly Booking[]): void {
  try {
    storage?.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings.map(toStored)));
  } catch {
    // Les réservations restent en mémoire pour cette session de la page : seul le rechargement les oublie.
  }
}
