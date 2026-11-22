import { describe, expect, it } from 'vitest';

import { DEMO_SPECTACLES } from '../donnees-demo/spectacles.demo';
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

const spectacle = (id: string) => {
  const trouve = DEMO_SPECTACLES.find((s) => s.id === id);
  if (trouve === undefined) {
    throw new Error(`Spectacle ${id} introuvable.`);
  }
  return trouve;
};

describe('tarifs propres à chaque pièce (export de la maquette)', () => {
  it.each([
    ['misanthrope', 32, 18],
    ['vasseur', 26, 15],
    ['jeu-amour-hasard', 29, 16],
    ['avare', 35, 20],
    ['cyrano', 38, 22],
    ['cle-sous-la-porte', 24, 14],
    ['huis-clos', 24, 14],
  ])('%s : plein %i €, moins de 26 ans %i €', (id, full, reduced) => {
    expect(spectacle(id).fares).toEqual({ full, reduced });
  });

  it('le formulaire repart du plein tarif et de deux places', () => {
    expect(INITIAL_FARE).toBe('full');
    expect(INITIAL_SEAT_COUNT).toBe(2);
  });

  it('deux places au plein tarif du Jeu de l’amour et du hasard : 58 €', () => {
    expect(bookingTotal(spectacle('jeu-amour-hasard'), 'full', 2)).toBe(58);
  });

  it('le tarif réduit et la quantité changent le total : 3 × 16 € = 48 €', () => {
    expect(bookingTotal(spectacle('jeu-amour-hasard'), 'reduced', 3)).toBe(48);
    expect(bookingTotal(spectacle('misanthrope'), 'full', MAX_SEAT_COUNT)).toBe(192);
  });
});

describe('nombre de places : de 1 à 6', () => {
  it('clampSeatCount reste dans les bornes', () => {
    expect([clampSeatCount(0), clampSeatCount(1), clampSeatCount(6), clampSeatCount(7), clampSeatCount(-3)]).toEqual([1, 1, 6, 6, 1]);
    expect([MIN_SEAT_COUNT, MAX_SEAT_COUNT]).toEqual([1, 6]);
  });

  it('seuls les entiers de 1 à 6 sont valides', () => {
    expect([0, 1, 6, 7, 1.5, Number.NaN, '2', null].map(isValidSeatCount)).toEqual([false, true, true, false, false, false, false, false]);
  });
});

describe('référence de réservation', () => {
  it('suit la formule de la maquette : LV- puis (4821 + rang × 137 + début) en base 36', () => {
    expect(generateReference(0, 1200, new Set())).toBe('LV-4N9');
    expect(generateReference(1, 1200, new Set())).toBe('LV-4R2');
  });

  it('une référence déjà prise est décalée : jamais deux réservations avec la même', () => {
    expect(generateReference(0, 1200, new Set(['LV-4N9']))).toBe('LV-4NA');
  });
});

describe('ajout d’une réservation', () => {
  const first = { performanceId: 'jeu-amour-hasard-2026-11-28-1200', startMinutes: 1200, fare: 'full', seatCount: 2 } as const;

  it('une confirmation crée une seule réservation, en tête de liste', () => {
    const { bookings, reference } = addBooking([], first);
    expect(bookings).toEqual([{ reference, performanceId: first.performanceId, fare: 'full', seatCount: 2 }]);
  });

  it('le compteur compte les réservations, pas les places', () => {
    const one = addBooking([], first).bookings;
    const two = addBooking(one, { performanceId: 'cyrano-2026-11-28-1200', startMinutes: 1200, fare: 'reduced', seatCount: 6 });
    expect(two.bookings).toHaveLength(2);
    expect(two.bookings.reduce((sum, b: Booking) => sum + b.seatCount, 0)).toBe(8);
    expect(two.bookings[0]?.reference).toBe(two.reference);
    expect(new Set(two.bookings.map((b) => b.reference)).size).toBe(2);
  });
});

describe('action de réservation selon le statut', () => {
  it('« à temps » : Réserver cette séance ; à vérifier ou impossible : Réserver malgré tout', () => {
    expect(bookActionLabel('possible')).toBe('Réserver cette séance');
    expect(bookActionLabel('a-verifier')).toBe('Réserver malgré tout');
    expect(bookActionLabel('impossible')).toBe('Réserver malgré tout');
  });
});
