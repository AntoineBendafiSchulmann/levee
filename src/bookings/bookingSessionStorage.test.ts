import { describe, expect, it } from 'vitest';

import { DEMO_SPECTACLES } from '../donnees-demo/spectacles.demo';
import type { Stockage } from '../parcours/stockageCriteres';
import type { Booking } from './bookingRules';
import { BOOKINGS_STORAGE_KEY, parseBookings, readBookings, writeBookings } from './bookingSessionStorage';

const EIGHT_PM = 'jeu-amour-hasard-2026-11-28-1200';
const FOUR_THIRTY_PM = 'jeu-amour-hasard-2026-11-28-990';
const ONE: Booking = { reference: 'LV-4N9', performanceId: EIGHT_PM, fare: 'full', seatCount: 2 };

/** Ce que la version précédente écrivait, relevé tel quel dans le `sessionStorage` d'un onglet (deux réservations). */
const LEGACY_PAYLOAD =
  '[{"reference":"LV-4L8","seanceId":"jeu-amour-hasard-2026-11-28-990","tarif":"plein","places":2},' +
  '{"reference":"LV-4N9","seanceId":"jeu-amour-hasard-2026-11-28-1200","tarif":"reduit","places":3}]';

/** Une entrée au format persisté ; `extra` écrase ou ajoute des champs pour fabriquer des entrées invalides. */
const stored = (extra: Record<string, unknown> = {}) => ({ reference: 'LV-4N9', seanceId: EIGHT_PM, tarif: 'plein', places: 2, ...extra });

function memory(initial?: string): Stockage & { value: () => string | null } {
  let value: string | null = initial ?? null;
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next;
    },
    value: () => value,
  };
}

describe('réservations conservées dans l’onglet', () => {
  it('un contexte vierge commence vide', () => {
    expect(readBookings(memory(), DEMO_SPECTACLES)).toEqual([]);
    expect(readBookings(undefined, DEMO_SPECTACLES)).toEqual([]);
  });

  it('écrit sous une clé dédiée et relit les mêmes réservations, représentation de 20 h comprise', () => {
    const storage = memory();
    const two: Booking[] = [{ reference: 'LV-4RW', performanceId: FOUR_THIRTY_PM, fare: 'reduced', seatCount: 6 }, ONE];
    writeBookings(storage, two);
    expect(BOOKINGS_STORAGE_KEY).toBe('levee:reservations');
    expect(readBookings(storage, DEMO_SPECTACLES)).toEqual(two);
  });

  it('un stockage inaccessible ne casse rien : lecture vide, écriture ignorée', () => {
    const broken: Stockage = {
      getItem: () => {
        throw new Error('accès refusé');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };
    expect(readBookings(broken, DEMO_SPECTACLES)).toEqual([]);
    expect(() => {
      writeBookings(broken, [ONE]);
    }).not.toThrow();
    expect(() => {
      writeBookings(undefined, [ONE]);
    }).not.toThrow();
  });

  it('un contenu illisible ou invalide est ignoré en entier', () => {
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
      expect(readBookings(memory(raw), DEMO_SPECTACLES)).toEqual([]);
    }
  });

  it('les entrées valides sont acceptées, les champs en trop sont écartés', () => {
    expect(parseBookings([stored({ intrus: true })], DEMO_SPECTACLES)).toEqual([ONE]);
    expect(parseBookings([], DEMO_SPECTACLES)).toEqual([]);
  });
});

describe('contrat persisté : le format enregistré avant le renommage des identifiants', () => {
  it('se relit avec la même représentation, le même tarif et la même quantité', () => {
    expect(readBookings(memory(LEGACY_PAYLOAD), DEMO_SPECTACLES)).toEqual([
      { reference: 'LV-4L8', performanceId: FOUR_THIRTY_PM, fare: 'full', seatCount: 2 },
      { reference: 'LV-4N9', performanceId: EIGHT_PM, fare: 'reduced', seatCount: 3 },
    ]);
  });

  it('se réécrit octet pour octet à l’identique : aucun champ ni valeur ne change', () => {
    const storage = memory();
    writeBookings(storage, readBookings(memory(LEGACY_PAYLOAD), DEMO_SPECTACLES));
    expect(storage.value()).toBe(LEGACY_PAYLOAD);
  });
});
