import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { DEMO_SALLES } from '../donnees-demo/salles.demo';
import { DEMO_SPECTACLES } from '../donnees-demo/spectacles.demo';
import type { Booking } from './bookingRules';
import { BookingReceipt } from './BookingReceipt';
import { summarizeBooking } from './bookingSummary';

const booking = (performanceId: string, extra: Partial<Booking> = {}): Booking => ({
  reference: 'LV-4N9',
  performanceId,
  fare: 'full',
  seatCount: 2,
  ...extra,
});

describe('réservation décrite d’après la représentation réservée', () => {
  it('la représentation de 20 h garde son heure, pas celle de 16 h 30 : deux places, 58 €', () => {
    expect(summarizeBooking(booking('jeu-amour-hasard-2026-11-28-1200'), DEMO_SPECTACLES, DEMO_SALLES)).toEqual({
      reference: 'LV-4N9',
      title: 'Le Jeu de l’amour et du hasard',
      when: 'Samedi 28 novembre · 20h00',
      venue: 'Théâtre de la Rotonde, 4 place de la Rotonde',
      seats: '2 places · plein tarif',
      total: '58 €',
    });
    expect(summarizeBooking(booking('jeu-amour-hasard-2026-11-28-990'), DEMO_SPECTACLES, DEMO_SALLES)?.when).toBe(
      'Samedi 28 novembre · 16h30',
    );
  });

  it('tarif réduit et une place : singulier, « moins de 26 ans », prix de la pièce', () => {
    const summary = summarizeBooking(
      booking('jeu-amour-hasard-2026-11-28-1200', { fare: 'reduced', seatCount: 1 }),
      DEMO_SPECTACLES,
      DEMO_SALLES,
    );
    expect(summary?.seats).toBe('1 place · moins de 26 ans');
    expect(summary?.total).toBe('16 €');
  });

  it('une représentation qui n’existe plus ne donne pas de résumé', () => {
    expect(summarizeBooking(booking('disparue-2026-11-28-1200'), DEMO_SPECTACLES, DEMO_SALLES)).toBeUndefined();
  });

  it('le reçu et la ligne de « Mes billets » présentent les mêmes informations', () => {
    const summary = summarizeBooking(booking('jeu-amour-hasard-2026-11-28-1200'), DEMO_SPECTACLES, DEMO_SALLES);
    if (summary === undefined) {
      throw new Error('Résumé attendu.');
    }
    const receipt = renderToStaticMarkup(<BookingReceipt summary={summary} variant="receipt" />);
    const listItem = renderToStaticMarkup(<BookingReceipt summary={summary} variant="listItem" />);
    for (const text of [summary.reference, summary.title, summary.when, summary.venue, summary.seats, summary.total]) {
      expect(receipt).toContain(text);
      expect(listItem).toContain(text);
    }
    expect(receipt).toContain('aucun billet n’a été émis');
  });
});
