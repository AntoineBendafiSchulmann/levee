import { useCallback, useEffect, useState } from 'react';

import { trouverSeance } from '../domaine/seance';
import type { FareId, Spectacle } from '../domaine/types';
import { stockageOnglet } from '../parcours/stockageCriteres';
import { addBooking, clampSeatCount, INITIAL_FARE, INITIAL_SEAT_COUNT, type Booking } from './bookingRules';
import { readBookings, writeBookings } from './bookingSessionStorage';

/** Ce que montre la feuille : le formulaire d'une représentation, le reçu d'une réservation, ou « Mes billets ». */
export type SheetView =
  | { readonly type: 'form'; readonly performanceId: string }
  | { readonly type: 'confirmation'; readonly reference: string }
  | { readonly type: 'tickets' };

interface SheetState {
  readonly open: boolean;
  /** La vue reste en place quand la feuille se ferme, pour que son contenu ne disparaisse pas pendant l'animation. */
  readonly view: SheetView;
  /** Choix du formulaire : à chaque ouverture il repart du plein tarif et de deux places. */
  readonly fare: FareId;
  readonly seatCount: number;
}

/**
 * Réservations simulées de l'onglet (`items`, `count`) (gardées dans le `sessionStorage`, en mémoire seulement si le stockage est
 * inaccessible) et état de la feuille qui les présente. Le compteur de la navbar est le nombre de réservations,
 * pas le nombre de places.
 */
export function useBookings(plays: readonly Spectacle[]) {
  const [bookings, setBookings] = useState<readonly Booking[]>(() => readBookings(stockageOnglet(), plays));
  const [sheet, setSheet] = useState<SheetState>({
    open: false,
    view: { type: 'tickets' },
    fare: INITIAL_FARE,
    seatCount: INITIAL_SEAT_COUNT,
  });

  useEffect(() => {
    writeBookings(stockageOnglet(), bookings);
  }, [bookings]);

  const close = useCallback(() => {
    setSheet((previous) => (previous.open ? { ...previous, open: false } : previous));
  }, []);

  // Retour ou avance du navigateur : l'écran change, la feuille ne reste pas ouverte dessus.
  useEffect(() => {
    window.addEventListener('popstate', close);
    return () => {
      window.removeEventListener('popstate', close);
    };
  }, [close]);

  const open = useCallback((view: SheetView) => {
    setSheet({ open: true, view, fare: INITIAL_FARE, seatCount: INITIAL_SEAT_COUNT });
  }, []);

  const chooseFare = useCallback((fare: FareId) => {
    setSheet((previous) => ({ ...previous, fare }));
  }, []);
  /** Une place de plus ou de moins, sans sortir de 1 à 6. */
  const changeSeatCount = useCallback((delta: number) => {
    setSheet((previous) => ({ ...previous, seatCount: clampSeatCount(previous.seatCount + delta) }));
  }, []);

  /** Ouvre le formulaire pour la représentation exacte donnée (identifiant `spectacle-jour-début`). */
  const openBookingForm = useCallback(
    (performanceId: string) => {
      open({ type: 'form', performanceId });
    },
    [open],
  );
  const openTickets = useCallback(() => {
    open({ type: 'tickets' });
  }, [open]);

  /** Crée une seule réservation, avec le tarif et les places du formulaire, et affiche son reçu ; sans effet si la représentation n'existe pas. */
  const confirm = useCallback(
    (performanceId: string) => {
      const found = trouverSeance(plays, performanceId);
      if (found === undefined) {
        return;
      }
      const added = addBooking(bookings, {
        performanceId,
        startMinutes: found.seance.debutMinutes,
        fare: sheet.fare,
        seatCount: sheet.seatCount,
      });
      setBookings(added.bookings);
      setSheet((previous) => ({ ...previous, view: { type: 'confirmation', reference: added.reference } }));
    },
    [plays, bookings, sheet.fare, sheet.seatCount],
  );

  return { items: bookings, count: bookings.length, sheet, openBookingForm, openTickets, confirm, close, chooseFare, changeSeatCount };
}

export type Bookings = ReturnType<typeof useBookings>;
