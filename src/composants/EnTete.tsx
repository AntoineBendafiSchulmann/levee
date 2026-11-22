import { ID_SELECTION, type Ecran } from '../parcours/chemins';
import { surClicSimple } from './lien';

interface Props {
  /** Écran affiché : « À l'affiche » est la page courante sur l'accueil. */
  readonly ecran: Ecran;
  /** Date du jour sélectionné, affichée à partir de 700 px (« Jeudi 26 novembre »). */
  readonly date: string;
  /** Logo et « À l'affiche » : en haut de l'accueil, ou retour à l'accueil depuis une autre page. */
  readonly onAccueil: () => void;
  /** « Séances de la soirée » : la sélection sous l'accueil. */
  readonly onSeances: () => void;
}

const CLASSES_LOGO = 'flex min-h-11 items-center font-editorial text-[34px] leading-none italic';
const CLASSES_ENTREE =
  'min-h-11 items-center rounded-full px-3.5 text-sm font-semibold text-texte-doux hover:bg-surface-survol hover:text-texte';

export function EnTete({ ecran, date, onAccueil, onSeances }: Props) {
  return (
    <header className="flex flex-none items-center justify-between gap-3 border-b border-filet px-4 py-1.5 tablette:px-6 tablette:py-2 bureau:px-8 ultra:px-16 ultra:py-2.5">
      <div className="flex min-w-0 items-baseline gap-4">
        <a href="/" aria-label="levee, accueil" className={CLASSES_LOGO} onClick={surClicSimple(onAccueil)}>
          levee
        </a>
        <span className="hidden text-[13px] tracking-[0.12em] text-texte-doux uppercase tablette:inline">{date}</span>
      </div>
      <nav aria-label="Navigation principale" className="flex items-center gap-1">
        <a
          href="/"
          aria-current={ecran === 'accueil' ? 'page' : undefined}
          className={`${CLASSES_ENTREE} hidden tablette:inline-flex ${ecran === 'accueil' ? 'text-texte underline decoration-2 underline-offset-[10px]' : ''}`}
          onClick={surClicSimple(onAccueil)}
        >
          À l’affiche
        </a>
        <a href={`/#${ID_SELECTION}`} className={`${CLASSES_ENTREE} inline-flex`} onClick={surClicSimple(onSeances)}>
          <span className="tablette:hidden">Séances</span>
          <span className="hidden tablette:inline">Séances de la soirée</span>
        </a>
      </nav>
    </header>
  );
}
