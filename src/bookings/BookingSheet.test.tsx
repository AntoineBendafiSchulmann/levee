import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { DEMO_CRITERES_INITIAUX } from '../donnees-demo/criteres.demo';
import { DEMO_SALLES } from '../donnees-demo/salles.demo';
import { DEMO_SPECTACLES } from '../donnees-demo/spectacles.demo';
import type { CriteresSortie, FareId } from '../domaine/types';
import type { Booking } from './bookingRules';
import { BookingSheet } from './BookingSheet';
import type { Bookings, SheetView } from './useBookings';

const SATURDAY: CriteresSortie = { ...DEMO_CRITERES_INITIAUX, jour: '2026-11-28' };
const noop = () => undefined;

interface Options {
  readonly items?: readonly Booking[];
  readonly fare?: FareId;
  readonly seatCount?: number;
  readonly provenance?: 'accueil' | 'resultats' | null;
  readonly criteria?: CriteresSortie;
}

function render(view: SheetView, { items = [], fare = 'full', seatCount = 2, provenance = 'accueil', criteria = SATURDAY }: Options = {}) {
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
      plays={DEMO_SPECTACLES}
      venues={DEMO_SALLES}
      criteria={criteria}
      originLabel="République"
      provenance={provenance}
      onBack={noop}
    />,
  );
}

const EIGHT_PM = 'jeu-amour-hasard-2026-11-28-1200';
const ONE: Booking = { reference: 'LV-4N9', performanceId: EIGHT_PM, fare: 'full', seatCount: 2 };
const FORM: SheetView = { type: 'form', performanceId: EIGHT_PM };

describe('feuille « Réservation »', () => {
  it('représentation de 20 h, plein tarif, deux places : récapitulatif complet et total de 58 €', () => {
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

  it('propose les deux tarifs de la pièce, le plein tarif sélectionné par défaut', () => {
    const html = render(FORM);
    expect(html).toMatch(/aria-pressed="true"[^>]*>(?:(?!<\/button>).)*Plein tarif/);
    expect(html).toMatch(/aria-pressed="false"[^>]*>(?:(?!<\/button>).)*Moins de 26 ans(?:(?!<\/button>).)*16 €/);
  });

  it('tarif réduit et trois places : 48 €', () => {
    const html = render(FORM, { fare: 'reduced', seatCount: 3 });
    expect(html).toContain('Confirmer la simulation · 48 €');
    expect(html).toContain('Moins de 26 ans · 16 €');
  });

  it('aux bornes, la flèche concernée est signalée inactive', () => {
    const one = render(FORM, { seatCount: 1 });
    expect(one).toMatch(/aria-label="Une place de moins" aria-disabled="true"/);
    expect(one).toMatch(/aria-label="Une place de plus" aria-disabled="false"/);
    expect(render(FORM, { seatCount: 6 })).toMatch(/aria-label="Une place de plus" aria-disabled="true"/);
  });

  it('une séance à temps ne porte pas de verdict ; une séance à vérifier ou impossible oui', () => {
    const onTime = render(FORM);
    const impossible = render(FORM, { criteria: { ...SATURDAY, limiteMinutes: 20 * 60 } });
    expect(onTime).not.toContain('border-danger');
    expect(impossible).toContain('border-danger');
  });
});

describe('feuille « C’est noté » et « Mes billets »', () => {
  it('le reçu affiche la réservation et la mention de simulation, avec le retour selon l’origine', () => {
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
    expect(render({ type: 'confirmation', reference: 'LV-4N9' }, { items: [ONE], provenance: 'resultats' })).toContain('Retour aux résultats');
  });

  it('« Mes billets » sans réservation : l’état vide de la maquette', () => {
    const html = render({ type: 'tickets' });
    expect(html).toContain('Mes billets');
    expect(html).toContain('Aucune réservation simulée pour l’instant.');
  });

  it('« Mes billets » liste les réservations, la plus récente d’abord, avec les mêmes informations que le reçu', () => {
    const two: Booking[] = [{ reference: 'LV-4RW', performanceId: 'cyrano-2026-11-28-1200', fare: 'reduced', seatCount: 6 }, ONE];
    const html = render({ type: 'tickets' }, { items: two });
    expect(html.indexOf('LV-4RW')).toBeLessThan(html.indexOf('LV-4N9'));
    expect(html).toContain('6 places · moins de 26 ans · 132 €');
    expect(html).toContain('2 places · plein tarif');
    expect(html).not.toContain('Aucune réservation simulée');
  });
});
