interface CriterionChip {
  /** Chip label; empty when the value is self-explanatory (« Ce soir »). */
  readonly label: string;
  readonly value: string;
}

interface Props {
  readonly chips: readonly CriterionChip[];
  readonly viewLabel: string;
  /** Performance counters under the label, e.g. « 4 possibles · 1 à vérifier · 1 impossible ». */
  readonly viewDetail: string;
  readonly onView: () => void;
  /** Opens the criteria sheet: from « Préparer une autre sortie » as well as from a chip. */
  readonly onEdit: () => void;
}

/** Outing criteria (each opens the criteria sheet), then the two home actions. */
export function HomeActions({ chips, viewLabel, viewDetail, onView, onEdit }: Props) {
  return (
    <div className="flex flex-col gap-2 tablette:gap-2.5">
      <ul aria-label="Critères de la sortie" className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <li key={chip.label + chip.value} className="flex flex-auto">
            <button
              type="button"
              onClick={onEdit}
              className="flex min-h-11 flex-auto items-center justify-center gap-[5px] rounded-full border border-filet bg-surface px-2 text-[13px] whitespace-nowrap hover:bg-surface-survol"
            >
              {chip.label === '' ? null : <span className="text-texte-doux">{chip.label}</span>}
              <span className="font-bold">{chip.value}</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onView}
        className="flex min-h-[62px] flex-col items-center justify-center gap-px rounded-full bg-corail px-[22px] py-2 text-fond hover:bg-corail-vif"
      >
        <span className="text-[17px] font-extrabold">{viewLabel}</span>
        <span className="text-[13px] font-medium">{viewDetail}</span>
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="min-h-12 rounded-full border border-contour text-[15px] font-semibold hover:bg-surface-survol"
      >
        Préparer une autre sortie
      </button>
    </div>
  );
}
