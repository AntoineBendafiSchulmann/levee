import { Affiche } from '../composants/Affiche';
import { BORDURE_GROUPE, TEXTE_GROUPE } from '../composants/presentationStatut';
import { verdictSeance } from '../domaine/explication';
import type { ResultatSeance } from '../domaine/resultats';
import { formaterHeure, libelleJourLong } from '../domaine/temps';
import type { CriteresSortie, FareId } from '../domaine/types';
import { bookingTotal, FARE_LABEL, FARE_ORDER, MAX_SEAT_COUNT, MIN_SEAT_COUNT, unitPrice } from './bookingRules';
import { endTimeLabel, formatAmount } from './bookingSummary';

interface Props {
  /** La représentation exacte sélectionnée sur la page de la pièce, avec son évaluation pour les critères courants. */
  readonly result: ResultatSeance;
  readonly criteria: CriteresSortie;
  readonly originLabel: string;
  readonly fare: FareId;
  readonly seatCount: number;
  readonly onFareChange: (fare: FareId) => void;
  /** `1` ou `-1` : une place de plus ou de moins. */
  readonly onSeatCountChange: (delta: number) => void;
}

const ROUND_BUTTON = 'size-11 rounded-full border border-contour text-[22px] aria-disabled:opacity-35';

/**
 * Contenu de la feuille « Réservation » : mention de simulation, récapitulatif de la représentation choisie, verdict
 * quand elle n'est pas « à temps », choix du tarif (propre à la pièce) et du nombre de places (de 1 à 6).
 */
export function BookingForm({ result, criteria, originLabel, fare, seatCount, onFareChange, onSeatCountChange }: Props) {
  const { spectacle: play, salle: venue, seance: performance, evaluation } = result;
  const { groupe: group } = evaluation;
  const rows: readonly (readonly [string, string])[] = [
    ['Date', libelleJourLong(performance.jour)],
    ['Heure', formaterHeure(performance.debutMinutes)],
    ['Lieu', `${venue.nom}, ${venue.adresse}`],
    ['Sortie calculée', endTimeLabel(evaluation.fin)],
    ['Tarif', `${FARE_LABEL[fare]} · ${formatAmount(unitPrice(play, fare))}`],
    ['Places', String(seatCount)],
    ['Total', formatAmount(bookingTotal(play, fare, seatCount))],
  ];

  return (
    <div className="flex flex-col gap-[18px]">
      <p className="self-start rounded-[3px] border border-dashed border-attention px-2.5 py-[5px] text-xs font-bold tracking-[0.1em] text-attention uppercase">
        Démonstration · aucun paiement, aucun billet
      </p>

      <div className="grid grid-cols-[84px_minmax(0,1fr)] items-start gap-4">
        <Affiche affiche={play.affiche} titre={play.titre} auteur={play.auteur} salle={venue.nom} />
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="font-editorial text-[28px] leading-none italic">{play.titre}</p>
          <p className="text-[13px] text-texte-doux">{play.auteur}</p>
          <dl className="flex flex-col gap-1.5">
            {rows.map(([name, value]) => (
              <div key={name} className="flex justify-between gap-3 border-t border-filet pt-1.5 text-sm">
                <dt className="text-texte-doux">{name}</dt>
                <dd className={`text-right font-bold ${name === 'Total' ? 'text-corail' : ''}`}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {group === 'possible' ? null : (
        <p className={`rounded-md border px-3.5 py-3 text-sm leading-snug ${TEXTE_GROUPE[group]} ${BORDURE_GROUPE[group]}`}>
          {verdictSeance(result, criteria, originLabel)}
        </p>
      )}

      <div role="group" aria-label="Tarif" className="grid grid-cols-2 gap-2">
        {FARE_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={fare === id}
            onClick={() => {
              onFareChange(id);
            }}
            className="flex min-h-16 flex-col items-start gap-0.5 rounded-md border-2 border-filet px-3 py-2.5 text-left hover:bg-surface-survol aria-pressed:border-texte aria-pressed:bg-surface-2"
          >
            <span className="text-[13px]">{FARE_LABEL[id]}</span>
            <span className="text-xl font-extrabold">{formatAmount(unitPrice(play, id))}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span id="seat-count-label" className="text-[15px]">
          Nombre de places
        </span>
        <div role="group" aria-labelledby="seat-count-label" className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Une place de moins"
            aria-disabled={seatCount <= MIN_SEAT_COUNT}
            onClick={() => {
              if (seatCount > MIN_SEAT_COUNT) {
                onSeatCountChange(-1);
              }
            }}
            className={ROUND_BUTTON}
          >
            −
          </button>
          <output aria-live="polite" className="min-w-6 text-center text-[22px] font-extrabold">
            {seatCount}
          </output>
          <button
            type="button"
            aria-label="Une place de plus"
            aria-disabled={seatCount >= MAX_SEAT_COUNT}
            onClick={() => {
              if (seatCount < MAX_SEAT_COUNT) {
                onSeatCountChange(1);
              }
            }}
            className={ROUND_BUTTON}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
