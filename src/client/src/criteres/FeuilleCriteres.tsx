import { useEffect, useId, useRef, type ReactNode } from 'react';

interface Props {
  readonly ouverte: boolean;
  readonly onFermer: () => void;
  /** Texte du bouton d'application, par exemple « Voir 6 séances ». */
  readonly libelleVoir: string;
  readonly onVoir: () => void;
  readonly children: ReactNode;
}

/*
 * Feuille modale native (<dialog>) : piège à focus, Échap, arrière-plan inerte et retour du focus à
 * l'élément qui l'a ouverte sont fournis par le navigateur. Mobile : feuille montant du bas ;
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

export function FeuilleCriteres({ ouverte, onFermer, libelleVoir, onVoir, children }: Props) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const idTitre = useId();

  useEffect(() => {
    const element = dialogue.current;
    if (element === null) {
      return;
    }
    if (ouverte && !element.open) {
      element.showModal();
    } else if (!ouverte && element.open) {
      element.close();
    }
  }, [ouverte]);

  return (
    <dialog
      ref={dialogue}
      aria-labelledby={idTitre}
      className={CLASSES}
      // Échap ou fermeture programmée : le navigateur ferme la feuille, l'état doit suivre.
      onClose={onFermer}
      // Un clic sur l'arrière-plan atteint le <dialog> lui-même.
      onClick={(evenement) => {
        if (evenement.target === evenement.currentTarget) {
          onFermer();
        }
      }}
    >
      <div className="flex flex-none items-center justify-between gap-3 px-5 pt-[18px] pb-2.5">
        <h2 id={idTitre} className="font-editorial text-[30px] leading-none font-normal italic">
          Votre sortie
        </h2>
        <button
          type="button"
          onClick={onFermer}
          className="min-h-11 rounded-full border border-filet px-3.5 text-sm font-semibold hover:bg-surface-survol"
        >
          Fermer
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-2.5 pb-6">{children}</div>
      <div className="flex-none border-t border-filet px-5 pt-3 pb-[18px]">
        <button
          type="button"
          onClick={onVoir}
          className="min-h-[54px] w-full rounded-full bg-corail text-base font-extrabold text-fond hover:bg-corail-vif"
        >
          {libelleVoir}
        </button>
      </div>
    </dialog>
  );
}
