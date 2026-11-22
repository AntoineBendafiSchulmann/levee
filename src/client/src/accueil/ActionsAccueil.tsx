interface Critere {
  /** Intitulé de la pastille ; vide quand la valeur se suffit (« Ce soir »). */
  readonly cle: string;
  readonly valeur: string;
}

interface Props {
  readonly criteres: readonly Critere[];
  readonly libelleVoir: string;
  readonly detailVoir: string;
  readonly onVoir: () => void;
  readonly onPreparer: () => void;
}

/**
 * Critères de la sortie, en lecture seule, puis les deux actions de l'accueil. Les critères sont
 * des éléments de liste et non des boutons : ils ne se modifient pas dans cette version.
 */
export function ActionsAccueil({ criteres, libelleVoir, detailVoir, onVoir, onPreparer }: Props) {
  return (
    <div className="flex flex-col gap-2 tablette:gap-2.5">
      <p className="text-[11px] leading-4 text-texte-doux">Critères de la sortie · lecture seule</p>
      <ul aria-label="Critères de la sortie, en lecture seule" className="flex flex-wrap gap-1.5">
        {criteres.map((critere) => (
          <li
            key={critere.cle + critere.valeur}
            className="flex min-h-11 flex-auto items-center justify-center gap-[5px] rounded-full border border-filet bg-surface px-2 text-[13px] whitespace-nowrap"
          >
            {critere.cle === '' ? null : <span className="text-texte-doux">{critere.cle}</span>}
            <span className="font-bold">{critere.valeur}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onVoir}
        className="flex min-h-[62px] flex-col items-center justify-center gap-px rounded-full bg-corail px-[22px] py-2 text-fond hover:bg-corail-vif"
      >
        <span className="text-[17px] font-extrabold">{libelleVoir}</span>
        <span className="text-[13px] font-medium">{detailVoir}</span>
      </button>
      <button
        type="button"
        onClick={onPreparer}
        className="min-h-12 rounded-full border border-contour text-[15px] font-semibold hover:bg-surface-survol"
      >
        Préparer une autre sortie
      </button>
    </div>
  );
}
