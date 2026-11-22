import { Sheet } from '../components/ui/Sheet';
import { performanceResult } from '../domain/results';
import { findVenue, findPerformance } from '../domain/performances';
import type { OutingCriteria, Venue, Play } from '../domain/types';
import type { PlayPageSource } from '../navigation/routes';
import { BookingForm } from './BookingForm';
import { BookingReceipt } from './BookingReceipt';
import { bookingTotal } from './bookingRules';
import { formatAmount, summarizeBooking } from './bookingSummary';
import type { Bookings } from './useBookings';

interface BookingSheetProps {
  readonly bookings: Bookings;
  readonly plays: readonly Play[];
  readonly venues: readonly Venue[];
  readonly criteria: OutingCriteria;
  readonly departurePointLabel: string;
  /** Where the user came from to reach the play page: the confirmation's back button depends on it. */
  readonly source: PlayPageSource | null;
  /** Back to the originating screen, when the confirmation is shown on a play page. */
  readonly onBack: () => void;
}

const BUTTON = 'min-h-[54px] rounded-full px-4 font-semibold';
const SECONDARY_BUTTON = `${BUTTON} flex-[1_1_150px] border border-contour text-[15px] hover:bg-surface-survol`;

/**
 * The bookings sheet, mounted once at the root: « Réservation » (the selected performance, the
 * fare and the seats), « C'est noté » (the receipt of the booking just created) and « Mes billets » (all the
 * tab's bookings, most recent first, or the empty state).
 */
export function BookingSheet({ bookings, plays, venues, criteria, departurePointLabel, source, onBack }: BookingSheetProps) {
  const { sheet, close } = bookings;
  const { view } = sheet;

  if (view.type === 'form') {
    const found = findPerformance(plays, view.performanceId);
    if (found === undefined) {
      return null;
    }
    const { play: play, performance: performance } = found;
    const result = performanceResult(play, findVenue(venues, play), performance, criteria);
    return (
      <Sheet
        open={sheet.open}
        onClose={close}
        title="Réservation"
        footer={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={close} className={SECONDARY_BUTTON}>
              Changer de séance
            </button>
            <button
              type="button"
              onClick={() => {
                bookings.confirm(view.performanceId);
              }}
              className={`${BUTTON} flex-[2_1_200px] bg-corail text-base font-extrabold text-fond hover:bg-corail-vif`}
            >
              Confirmer la simulation · {formatAmount(bookingTotal(play, sheet.fare, sheet.seatCount))}
            </button>
          </div>
        }
      >
        <BookingForm
          result={result}
          criteria={criteria}
          departurePointLabel={departurePointLabel}
          fare={sheet.fare}
          seatCount={sheet.seatCount}
          onFareChange={bookings.chooseFare}
          onSeatCountChange={bookings.changeSeatCount}
        />
      </Sheet>
    );
  }

  if (view.type === 'confirmation') {
    const booking = bookings.items.find((b) => b.reference === view.reference);
    const summary = booking === undefined ? undefined : summarizeBooking(booking, plays, venues);
    return (
      <Sheet
        open={sheet.open}
        onClose={close}
        title="C’est noté"
        footer={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={close} className={SECONDARY_BUTTON}>
              Revoir la fiche
            </button>
            <button
              type="button"
              onClick={() => {
                close();
                onBack();
              }}
              className={`${BUTTON} flex-[1_1_150px] bg-texte text-[15px] font-extrabold text-fond hover:opacity-90`}
            >
              {source === 'results' ? 'Retour aux résultats' : 'Retour à l’accueil'}
            </button>
          </div>
        }
      >
        {summary === undefined ? null : <BookingReceipt summary={summary} variant="receipt" />}
      </Sheet>
    );
  }

  const summaries = bookings.items.flatMap((b) => summarizeBooking(b, plays, venues) ?? []);
  return (
    <Sheet open={sheet.open} onClose={close} title="Mes billets">
      {summaries.length === 0 ? (
        <p className="text-[15px] text-texte-doux">Aucune réservation simulée pour l’instant.</p>
      ) : (
        <>
          <p className="mb-2.5 text-[13px] text-texte-doux">Démonstration : aucun paiement n’a eu lieu, aucun billet n’a été émis.</p>
          <ul className="flex flex-col gap-2.5">
            {summaries.map((summary) => (
              <li key={summary.reference}>
                <BookingReceipt summary={summary} variant="listItem" />
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  );
}
