import { Sheet } from '../composants/ui/Sheet';
import { resultatDeSeance } from '../domaine/resultats';
import { trouverSalle, trouverSeance } from '../domaine/seance';
import type { CriteresSortie, Salle, Spectacle } from '../domaine/types';
import type { ProvenancePiece } from '../parcours/chemins';
import { BookingForm } from './BookingForm';
import { BookingReceipt } from './BookingReceipt';
import { bookingTotal } from './bookingRules';
import { formatAmount, summarizeBooking } from './bookingSummary';
import type { Bookings } from './useBookings';

interface BookingSheetProps {
  readonly bookings: Bookings;
  readonly plays: readonly Spectacle[];
  readonly venues: readonly Salle[];
  readonly criteria: CriteresSortie;
  readonly originLabel: string;
  /** D'où l'on est venu sur la page de la pièce : le bouton de retour de la confirmation en dépend. */
  readonly provenance: ProvenancePiece | null;
  /** Retour à l'écran d'origine, quand la confirmation est affichée sur la page d'une pièce. */
  readonly onBack: () => void;
}

const BUTTON = 'min-h-[54px] rounded-full px-4 font-semibold';
const SECONDARY_BUTTON = `${BUTTON} flex-[1_1_150px] border border-contour text-[15px] hover:bg-surface-survol`;

/**
 * La feuille des réservations, montée une seule fois à la racine : « Réservation » (la représentation sélectionnée, le
 * tarif et les places), « C'est noté » (le reçu de la réservation qui vient d'être créée) et « Mes billets » (toutes les
 * réservations de l'onglet, la plus récente en premier, ou l'état vide).
 */
export function BookingSheet({ bookings, plays, venues, criteria, originLabel, provenance, onBack }: BookingSheetProps) {
  const { sheet, close } = bookings;
  const { view } = sheet;

  if (view.type === 'form') {
    const found = trouverSeance(plays, view.performanceId);
    if (found === undefined) {
      return null;
    }
    const { spectacle: play, seance: performance } = found;
    const result = resultatDeSeance(play, trouverSalle(venues, play), performance, criteria);
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
          originLabel={originLabel}
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
              {provenance === 'resultats' ? 'Retour aux résultats' : 'Retour à l’accueil'}
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
