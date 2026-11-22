import { EVENING_ANCHOR_ID, type Screen } from '../navigation/routes';
import { onPlainClick } from './plainClick';

interface Props {
  /** Displayed screen: « À l'affiche » is the current page on the home screen. */
  readonly screen: Screen;
  /** Selected day's date, shown from 700 px up (« Jeudi 26 novembre »). */
  readonly date: string;
  /** Logo and « À l'affiche »: top of the home screen, or back to home from another page. */
  readonly onHome: () => void;
  /** « Séances de la soirée »: the evening performances below the home screen. */
  readonly onEveningPerformances: () => void;
  /** Number of simulated bookings in this tab (bookings, not seats). */
  readonly bookingCount: number;
  /** « Billets · N »: opens « Mes billets », or its empty state when zero. */
  readonly onOpenTickets: () => void;
}

const LOGO_CLASSES = 'flex min-h-11 items-center font-editorial text-[34px] leading-none italic';
const LINK_CLASSES =
  'min-h-11 items-center rounded-full px-3.5 text-sm font-semibold text-texte-doux hover:bg-surface-survol hover:text-texte';

export function Navbar({ screen, date, onHome, onEveningPerformances, bookingCount, onOpenTickets }: Props) {
  return (
    <header className="flex flex-none items-center justify-between gap-3 border-b border-filet px-4 py-1.5 tablette:px-6 tablette:py-2 bureau:px-8 ultra:px-16 ultra:py-2.5">
      <div className="flex min-w-0 items-baseline gap-4">
        <a href="/" aria-label="levee, accueil" className={LOGO_CLASSES} onClick={onPlainClick(onHome)}>
          levee
        </a>
        <span className="hidden text-[13px] tracking-[0.12em] text-texte-doux uppercase tablette:inline">{date}</span>
      </div>
      <div className="flex flex-none items-center gap-1">
        <nav aria-label="Navigation principale" className="flex items-center gap-1">
          <a
            href="/"
            aria-current={screen === 'home' ? 'page' : undefined}
            className={`${LINK_CLASSES} hidden tablette:inline-flex ${screen === 'home' ? 'text-texte underline decoration-2 underline-offset-[10px]' : ''}`}
            onClick={onPlainClick(onHome)}
          >
            À l’affiche
          </a>
          <a href={`/#${EVENING_ANCHOR_ID}`} className={`${LINK_CLASSES} inline-flex`} onClick={onPlainClick(onEveningPerformances)}>
            <span className="tablette:hidden">Séances</span>
            <span className="hidden tablette:inline">Séances de la soirée</span>
          </a>
        </nav>
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={onOpenTickets}
          className="min-h-11 rounded-full border border-filet px-4 text-sm font-semibold whitespace-nowrap hover:bg-surface-survol"
        >
          Billets · {bookingCount}
        </button>
      </div>
    </header>
  );
}
