import { formaterHeure } from '../domaine/temps';

interface Props {
  readonly libelle: string;
  readonly minutes: number;
  readonly min: number;
  readonly max: number;
  readonly pas: number;
  readonly onChange: (minutes: number) => void;
  readonly libelleMoins: string;
  readonly libellePlus: string;
  /** `bloc` : réglage de la feuille de critères ; `barre` : version compacte de la barre des résultats. */
  readonly variante: 'bloc' | 'barre';
  readonly accent?: boolean;
}

const BOUTON =
  'grid size-11 flex-none place-items-center rounded-full border border-contour text-[22px] hover:bg-surface-survol aria-disabled:opacity-40 aria-disabled:hover:bg-transparent';

/**
 * Une heure réglable par pas, bornée. Aux bornes, les boutons s'éteignent visuellement (`aria-disabled`) sans
 * perdre le focus : un `disabled` le ferait tomber sur la page pour un utilisateur du clavier.
 */
export function ReglageHeure({
  libelle,
  minutes,
  min,
  max,
  pas,
  onChange,
  libelleMoins,
  libellePlus,
  variante,
  accent = false,
}: Props) {
  const enBarre = variante === 'barre';
  return (
    <div className={enBarre ? 'flex items-center justify-between gap-2.5' : 'flex flex-col gap-2'}>
      <span className={enBarre ? 'text-sm text-texte-doux' : 'text-xs font-semibold tracking-[0.12em] text-texte-doux uppercase'}>
        {libelle}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={libelleMoins}
          aria-disabled={minutes <= min}
          onClick={() => {
            onChange(Math.max(min, minutes - pas));
          }}
          className={BOUTON}
        >
          −
        </button>
        <output
          className={`text-center font-bold tracking-[-0.02em] ${
            enBarre ? 'min-w-[78px] text-2xl font-extrabold' : 'flex-1 text-[28px]'
          } ${accent ? 'text-corail' : ''}`}
        >
          {formaterHeure(minutes)}
        </output>
        <button
          type="button"
          aria-label={libellePlus}
          aria-disabled={minutes >= max}
          onClick={() => {
            onChange(Math.min(max, minutes + pas));
          }}
          className={BOUTON}
        >
          +
        </button>
      </div>
    </div>
  );
}
