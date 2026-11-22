import type { BookingSummary } from './bookingSummary';

interface Props {
  readonly summary: BookingSummary;
  /** `receipt`: the confirmation, with the simulation notice; `listItem`: a row of « Mes billets ». */
  readonly variant: 'receipt' | 'listItem';
}

/**
 * A simulated booking. The confirmation receipt and each row of « Mes billets » go through this component with
 * the same `BookingSummary`: they necessarily show the same information (reference, play, date and time,
 * venue, seats and fare, total).
 */
export function BookingReceipt({ summary, variant }: Props) {
  const receipt = variant === 'receipt';
  return (
    <article
      aria-label={`Billet ${summary.reference}`}
      className={`flex flex-col border border-dashed ${receipt ? 'gap-2.5 rounded-md border-texte p-[18px]' : 'gap-[5px] rounded-md border-contour px-4 py-3.5'}`}
    >
      <div className={`flex justify-between gap-3 text-xs font-bold uppercase ${receipt ? 'tracking-[0.12em]' : 'tracking-[0.1em]'}`}>
        <span>{receipt ? 'Réservation simulée' : summary.when}</span>
        <span>{summary.reference}</span>
      </div>
      <p className={`font-editorial italic ${receipt ? 'text-[30px] leading-none' : 'text-2xl leading-[1.05]'}`}>{summary.title}</p>
      {receipt ? <p className="text-[15px] font-bold">{summary.when}</p> : null}
      <p className="text-sm">{summary.venue}</p>
      {receipt ? (
        <p className="flex justify-between gap-3 border-t border-dashed border-contour pt-2.5 text-sm">
          <span>{summary.seats}</span>
          <span className="font-extrabold">{summary.total}</span>
        </p>
      ) : (
        <p className="text-[13px] text-texte-doux">
          {summary.seats} · {summary.total}
        </p>
      )}
      {receipt ? <p className="text-[13px] text-texte-doux">Démonstration : aucun paiement n’a eu lieu, aucun billet n’a été émis.</p> : null}
    </article>
  );
}
