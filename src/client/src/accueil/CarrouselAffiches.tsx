import { useLayoutEffect } from 'react';

import { Affiche } from './Affiche';
import type { DiapoAffiche } from './diapos';
import { useCarrousel } from './useCarrousel';

interface Props {
  readonly diapos: readonly DiapoAffiche[];
  /** Appelée quand on active l'affiche déjà centrée. Une autre affiche est d'abord centrée. */
  readonly onActiver: (diapo: DiapoAffiche) => void;
  /** Position de défilement à restituer au montage (retour sur l'accueil). */
  readonly lirePosition: () => number;
  /** Appelée à chaque défilement, pour mémoriser la position. */
  readonly onPosition: (position: number) => void;
}

/*
 * Dimensions du carrousel, toutes dérivées de quelques valeurs posées sur le défileur :
 *  - une affiche a un ratio 2/3 : sa hauteur vaut 1,5 × sa largeur ;
 *  - une diapositive = l'affiche + --legende (8 px d'espace + 63 px de texte sur 3 lignes) ;
 *  - le défileur = une diapositive + les marges haute et basse (place de l'anneau de focus et de l'ombre).
 * La largeur d'affiche suit la hauteur disponible (100cqh) entre --largeur-min et --largeur-max (fixé
 * par taille d'écran). Les hauteurs minimale et maximale du défileur en découlent : rien n'est répété.
 */
const DEFILEUR = [
  'relative flex flex-1 snap-x snap-mandatory items-center gap-[18px] overflow-x-auto overflow-y-hidden',
  '[container-type:size] [scrollbar-width:none]',
  'pt-(--marge-haut) pb-(--marge-bas)',
  'min-h-[calc(var(--largeur-min)*1.5_+_var(--hors-affiche))]',
  'max-h-[calc(var(--largeur-max)*1.5_+_var(--hors-affiche))]',
  '[--largeur-min:112px] [--largeur-max:200px] tablette:[--largeur-max:280px] bureau:[--largeur-max:300px]',
  '[--legende:71px] [--marge-haut:6px] [--marge-bas:10px]',
  '[--hors-affiche:calc(var(--legende)_+_var(--marge-haut)_+_var(--marge-bas))]',
].join(' ');

// Les marges des extrémités (voir `first:` et `last:` plus bas) centrent la première et la dernière affiche.
const LARGEUR_DIAPO =
  '[--largeur-diapo:clamp(var(--largeur-min),calc((100cqh_-_var(--legende))*2/3),var(--largeur-max))]';

const BOUTON_FLECHE =
  'grid size-11 place-items-center rounded-full border border-contour text-lg hover:bg-surface-survol';

export function CarrouselAffiches({ diapos, onActiver, lirePosition, onPosition }: Props) {
  const { defileurRef, defiler, surTouche, centrer, estCentree } = useCarrousel(diapos.length);

  useLayoutEffect(() => {
    if (defileurRef.current !== null) {
      defileurRef.current.scrollLeft = lirePosition();
    }
  }, [defileurRef, lirePosition]);

  return (
    <section
      aria-roledescription="carrousel"
      aria-label="Pièces à l’affiche"
      className="flex flex-1 flex-col justify-center"
    >
      <div
        ref={defileurRef}
        onKeyDown={surTouche}
        onScroll={(evenement) => {
          onPosition(evenement.currentTarget.scrollLeft);
        }}
        className={DEFILEUR}
      >
        {diapos.map((diapo) => (
          <button
            key={diapo.id}
            type="button"
            data-diapo=""
            // Seul le focus clavier (Tab) centre l'affiche : l'anneau de focus n'est jamais rogné. Le focus
            // donné par la souris ou le doigt ne déplace rien ; le centrage se fait alors au clic.
            onFocus={(evenement) => {
              if (evenement.currentTarget.matches(':focus-visible')) {
                centrer(evenement.currentTarget);
              }
            }}
            onClick={(evenement) => {
              // detail === 0 : activation au clavier (Entrée, Espace) → on active tout de suite.
              // Souris ou doigt : une affiche non centrée est d'abord centrée.
              if (evenement.detail === 0 || estCentree(evenement.currentTarget)) {
                onActiver(diapo);
              } else {
                centrer(evenement.currentTarget);
              }
            }}
            className={`${LARGEUR_DIAPO} flex w-(--largeur-diapo) flex-none snap-center flex-col items-stretch gap-2 text-left first:ml-[calc(50cqw_-_var(--largeur-diapo)/2)] last:mr-[calc(50cqw_-_var(--largeur-diapo)/2)]`}
          >
            <span
              data-profondeur=""
              className="block w-full shadow-[0_18px_36px_oklch(0.08_0.02_285/0.6)] will-change-transform"
            >
              <Affiche affiche={diapo.affiche} titre={diapo.titre} auteur={diapo.auteur} salle={diapo.salle} />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-editorial text-[22px] leading-[1.05] italic">{diapo.titre}</span>
              <span className="truncate text-[13px] leading-[1.2] text-texte-doux">{diapo.salle}</span>
              <span className="mt-0.5 text-[15px] leading-[1.2] font-bold">{diapo.legende}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="hidden justify-center gap-2.5 pt-1 tablette:flex">
        <button
          type="button"
          aria-label="Affiche précédente"
          className={BOUTON_FLECHE}
          onClick={() => {
            defiler(-1);
          }}
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Affiche suivante"
          className={BOUTON_FLECHE}
          onClick={() => {
            defiler(1);
          }}
        >
          →
        </button>
      </div>
    </section>
  );
}
