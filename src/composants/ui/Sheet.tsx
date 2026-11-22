import { useEffect, useId, useRef, type ReactNode } from 'react';

interface SheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  /** Titre de la feuille, lu par les lecteurs d'écran (`aria-labelledby`). */
  readonly title: string;
  /** Zone fixe sous le contenu (boutons d'action) ; absente : la feuille n'a que son contenu. */
  readonly footer?: ReactNode;
  readonly children: ReactNode;
}

/*
 * Feuille modale native (<dialog>) : piège à focus, Échap, arrière-plan inerte et retour du focus à
 * l'élément qui l'a ouvert sont fournis par le navigateur. Mobile : feuille montant du bas ;
 * à partir de 700 px : panneau latéral de 440 px qui entre par la droite et repart par la droite (l'axe Y
 * est neutralisé aussi dans l'état de départ, sans quoi il arriverait du coin bas droit). Mouvement
 * réduit : pas de transition.
 */
const CLASSES = [
  'm-0 max-h-[90%] w-full max-w-none flex-col overflow-hidden bg-surface p-0 text-texte open:flex',
  'fixed inset-x-0 top-auto bottom-0 rounded-t-2xl shadow-[0_0_60px_oklch(0.08_0.02_285/0.7)]',
  'tablette:inset-y-0 tablette:right-0 tablette:left-auto tablette:h-full tablette:max-h-none tablette:w-[440px] tablette:rounded-none',
  'translate-y-full open:translate-y-0 starting:open:translate-y-full',
  'tablette:translate-x-full tablette:translate-y-0 tablette:open:translate-x-0 tablette:starting:open:translate-x-full tablette:starting:open:translate-y-0',
  'transition-[translate,display,overlay] transition-discrete duration-[340ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none',
  'backdrop:bg-[oklch(0.1_0.02_285/0.62)] backdrop:transition-[background-color,display,overlay] backdrop:transition-discrete backdrop:duration-300 motion-reduce:backdrop:transition-none starting:open:backdrop:bg-transparent',
].join(' ');

/**
 * Enveloppe commune de la feuille de critères et de la feuille des réservations : ouverture et fermeture du dialogue,
 * titre, bouton « Fermer », clic sur l'arrière-plan, zone de contenu défilante et pied fixe. Elle ne connaît
 * ni les critères ni les réservations : son contenu et son pied viennent de la fonctionnalité qui l'utilise.
 * Quand le titre change alors que la feuille est ouverte (une autre vue de la même feuille), le focus passe au titre :
 * le bouton qui vient de disparaître ne laisse pas le focus perdu.
 */
export function Sheet({ open, onClose, title, footer, children }: SheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const shownTitle = useRef<string | null>(null);
  const titleId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (element === null) {
      return;
    }
    if (open && !element.open) {
      element.showModal();
      // Le titre est focalisable (changement de vue) mais le focus d'ouverture reste sur « Fermer ».
      closeButton.current?.focus();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  useEffect(() => {
    if (open && shownTitle.current !== null && shownTitle.current !== title) {
      heading.current?.focus();
    }
    shownTitle.current = open ? title : null;
  }, [open, title]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      className={CLASSES}
      // Échap ou fermeture programmée : le navigateur ferme la feuille, l'état doit suivre.
      onClose={onClose}
      // Un clic sur l'arrière-plan atteint le <dialog> lui-même.
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex flex-none items-center justify-between gap-3 px-5 pt-[18px] pb-2.5">
        <h2 ref={heading} id={titleId} tabIndex={-1} className="font-editorial text-[30px] leading-none font-normal italic outline-none">
          {title}
        </h2>
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-full border border-filet px-3.5 text-sm font-semibold hover:bg-surface-survol"
        >
          Fermer
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-2.5 pb-6">{children}</div>
      {footer === undefined ? null : <div className="flex-none border-t border-filet px-5 pt-3 pb-[18px]">{footer}</div>}
    </dialog>
  );
}
