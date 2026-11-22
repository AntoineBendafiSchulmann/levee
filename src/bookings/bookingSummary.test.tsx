import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { DEMO_VENUES } from '../demo-data/venues.demo';
import { DEMO_PLAYS } from '../demo-data/plays.demo';
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

describe('booking described from the booked performance', () => {
  it('the 8 pm performance keeps its time, not the 4:30 pm one: two seats, 58 €', () => {
    expect(summarizeBooking(booking('jeu-amour-hasard-2026-11-28-1200'), DEMO_PLAYS, DEMO_VENUES)).toEqual({
      reference: 'LV-4N9',
      title: 'Le Jeu de l’amour et du hasard',
      when: 'Samedi 28 novembre · 20h00',
      venue: 'Théâtre de la Rotonde, 4 place de la Rotonde',
      seats: '2 places · plein tarif',
      total: '58 €',
    });
    expect(summarizeBooking(booking('jeu-amour-hasard-2026-11-28-990'), DEMO_PLAYS, DEMO_VENUES)?.when).toBe(
      'Samedi 28 novembre · 16h30',
    );
  });

  it('reduced fare and one seat: singular, « moins de 26 ans », play price', () => {
    const summary = summarizeBooking(
      booking('jeu-amour-hasard-2026-11-28-1200', { fare: 'reduced', seatCount: 1 }),
      DEMO_PLAYS,
      DEMO_VENUES,
    );
    expect(summary?.seats).toBe('1 place · moins de 26 ans');
    expect(summary?.total).toBe('16 €');
  });

  it('a performance that no longer exists yields no summary', () => {
    expect(summarizeBooking(booking('disparue-2026-11-28-1200'), DEMO_PLAYS, DEMO_VENUES)).toBeUndefined();
  });

  it('the receipt and the « Mes billets » row show the same information', () => {
    const summary = summarizeBooking(booking('jeu-amour-hasard-2026-11-28-1200'), DEMO_PLAYS, DEMO_VENUES);
    if (summary === undefined) {
      throw new Error('Summary expected.');
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
