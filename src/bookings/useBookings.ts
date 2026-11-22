import { useCallback, useEffect, useState } from 'react';

import { findPerformance } from '../domain/performances';
import type { FareId, Play } from '../domain/types';
import { tabStorage } from '../navigation/criteriaSessionStorage';
import { addBooking, clampSeatCount, INITIAL_FARE, INITIAL_SEAT_COUNT, type Booking } from './bookingRules';
import { readBookings, writeBookings } from './bookingSessionStorage';

/** What the sheet shows: a performance's form, a booking's receipt, or « Mes billets ». */
export type SheetView =
  | { readonly type: 'form'; readonly performanceId: string }
  | { readonly type: 'confirmation'; readonly reference: string }
  | { readonly type: 'tickets' };

interface SheetState {
  readonly open: boolean;
  /** The view stays in place when the sheet closes, so its content does not vanish during the animation. */
  readonly view: SheetView;
  /** Form choices: each time it opens it restarts from full fare and two seats. */
  readonly fare: FareId;
  readonly seatCount: number;
}

/**
 * Simulated bookings of the tab (`items`, `count`) (kept in `sessionStorage`, in memory only if storage is
 * inaccessible) and state of the sheet presenting them. The navbar counter is the number of bookings,
 * not the number of seats.
 */
export function useBookings(plays: readonly Play[]) {
  const [bookings, setBookings] = useState<readonly Booking[]>(() => readBookings(tabStorage(), plays));
  const [sheet, setSheet] = useState<SheetState>({
    open: false,
    view: { type: 'tickets' },
    fare: INITIAL_FARE,
    seatCount: INITIAL_SEAT_COUNT,
  });

  useEffect(() => {
    writeBookings(tabStorage(), bookings);
  }, [bookings]);

  const close = useCallback(() => {
    setSheet((previous) => (previous.open ? { ...previous, open: false } : previous));
  }, []);

  // Browser back or forward: the screen changes, the sheet does not stay open on top of it.
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
  /** One seat more or fewer, staying within 1 to 6. */
  const changeSeatCount = useCallback((delta: number) => {
    setSheet((previous) => ({ ...previous, seatCount: clampSeatCount(previous.seatCount + delta) }));
  }, []);

  /** Opens the form for the given exact performance (id `play-day-start`). */
  const openBookingForm = useCallback(
    (performanceId: string) => {
      open({ type: 'form', performanceId });
    },
    [open],
  );
  const openTickets = useCallback(() => {
    open({ type: 'tickets' });
  }, [open]);

  /** Creates a single booking, with the form's fare and seats, and shows its receipt; no effect if the performance does not exist. */
  const confirm = useCallback(
    (performanceId: string) => {
      const found = findPerformance(plays, performanceId);
      if (found === undefined) {
        return;
      }
      const added = addBooking(bookings, {
        performanceId,
        startMinutes: found.performance.startMinutes,
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
