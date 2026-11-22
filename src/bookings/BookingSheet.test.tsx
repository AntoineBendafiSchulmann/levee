import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { DEMO_INITIAL_CRITERIA } from '../demo-data/criteria.demo';
import { DEMO_VENUES } from '../demo-data/venues.demo';
import { DEMO_PLAYS } from '../demo-data/plays.demo';
import type { OutingCriteria, FareId } from '../domain/types';
import type { Booking } from './bookingRules';
import { BookingSheet } from './BookingSheet';
import type { Bookings, SheetView } from './useBookings';

const SATURDAY: OutingCriteria = { ...DEMO_INITIAL_CRITERIA, day: '2026-11-28' };
const noop = () => undefined;

interface Options {
  readonly items?: readonly Booking[];
  readonly fare?: FareId;
  readonly seatCount?: number;
  readonly source?: 'home' | 'results' | null;
  readonly criteria?: OutingCriteria;
}

function render(view: SheetView, { items = [], fare = 'full', seatCount = 2, source = 'home', criteria = SATURDAY }: Options = {}) {
  const bookings: Bookings = {
    items,
    count: items.length,
    sheet: { open: true, view, fare, seatCount },
    openBookingForm: noop,
    openTickets: noop,
    confirm: noop,
    close: noop,
    chooseFare: noop,
    changeSeatCount: noop,
  };
  return renderToStaticMarkup(
    <BookingSheet
      bookings={bookings}
      plays={DEMO_PLAYS}
      venues={DEMO_VENUES}
      criteria={criteria}
      departurePointLabel="République"
      source={source}
      onBack={noop}
    />,
  );
}

const EIGHT_PM = 'jeu-amour-hasard-2026-11-28-1200';
const ONE: Booking = { reference: 'LV-4N9', performanceId: EIGHT_PM, fare: 'full', seatCount: 2 };
const FORM: SheetView = { type: 'form', performanceId: EIGHT_PM };

describe('« Réservation » sheet', () => {
  it('8 pm performance, full fare, two seats: full summary and total of 58 €', () => {
    const html = render(FORM);
    expect(html).toContain('Réservation');
    expect(html).toContain('Démonstration · aucun paiement, aucun billet');
    for (const text of [
      'Samedi 28 novembre',
      '20h00',
      'Théâtre de la Rotonde, 4 place de la Rotonde',
      'Plein tarif · 29 €',
      'Confirmer la simulation · 58 €',
      'Changer de séance',
    ]) {
      expect(html).toContain(text);
    }
    expect(html).toContain('>58 €<');
    expect(html).not.toContain('16h30');
  });

  it('offers the play’s two fares, full fare selected by default', () => {
    const html = render(FORM);
    expect(html).toMatch(/aria-pressed="true"[^>]*>(?:(?!<\/button>).)*Plein tarif/);
    expect(html).toMatch(/aria-pressed="false"[^>]*>(?:(?!<\/button>).)*Moins de 26 ans(?:(?!<\/button>).)*16 €/);
  });

  it('reduced fare and three seats: 48 €', () => {
    const html = render(FORM, { fare: 'reduced', seatCount: 3 });
    expect(html).toContain('Confirmer la simulation · 48 €');
    expect(html).toContain('Moins de 26 ans · 16 €');
  });

  it('at the bounds, the relevant arrow is marked inactive', () => {
    const one = render(FORM, { seatCount: 1 });
    expect(one).toMatch(/aria-label="Une place de moins" aria-disabled="true"/);
    expect(one).toMatch(/aria-label="Une place de plus" aria-disabled="false"/);
    expect(render(FORM, { seatCount: 6 })).toMatch(/aria-label="Une place de plus" aria-disabled="true"/);
  });

  it('an on-time performance carries no verdict; a performance to check or impossible does', () => {
    const onTime = render(FORM);
    const impossible = render(FORM, { criteria: { ...SATURDAY, exitLimitMinutes: 20 * 60 } });
    expect(onTime).not.toContain('border-danger');
    expect(impossible).toContain('border-danger');
  });
});

describe('« C’est noté » and « Mes billets » sheets', () => {
  it('the receipt shows the booking and the simulation notice, with the back action depending on the origin', () => {
    const html = render({ type: 'confirmation', reference: 'LV-4N9' }, { items: [ONE] });
    expect(html).toContain('C’est noté');
    for (const text of [
      'Réservation simulée',
      'LV-4N9',
      'Samedi 28 novembre · 20h00',
      '2 places · plein tarif',
      '58 €',
      'Revoir la fiche',
      'Retour à l’accueil',
    ]) {
      expect(html).toContain(text);
    }
    expect(render({ type: 'confirmation', reference: 'LV-4N9' }, { items: [ONE], source: 'results' })).toContain('Retour aux résultats');
  });

  it('« Mes billets » with no booking: the mock-up empty state', () => {
    const html = render({ type: 'tickets' });
    expect(html).toContain('Mes billets');
    expect(html).toContain('Aucune réservation simulée pour l’instant.');
  });

  it('« Mes billets » lists the bookings, most recent first, with the same information as the receipt', () => {
    const two: Booking[] = [{ reference: 'LV-4RW', performanceId: 'cyrano-2026-11-28-1200', fare: 'reduced', seatCount: 6 }, ONE];
    const html = render({ type: 'tickets' }, { items: two });
    expect(html.indexOf('LV-4RW')).toBeLessThan(html.indexOf('LV-4N9'));
    expect(html).toContain('6 places · moins de 26 ans · 132 €');
    expect(html).toContain('2 places · plein tarif');
    expect(html).not.toContain('Aucune réservation simulée');
  });
});
