import { useEffect, useEffectEvent, useLayoutEffect, useRef, type MouseEvent, type ReactNode } from 'react';

import { surClicSimple } from '../commun/lien';
import { cheminCible } from '../parcours/chemins';
import { LIBELLE_STATUT, POINT_GROUPE, TEXTE_GROUPE } from '../resultats/statut';
import { Affiche } from './Affiche';
import type { DiapoAffiche } from './diapos';
import { indiceDepuisDefilement, useBureau, useCarrousel, voisins } from './useCarrousel';

interface Props {
  readonly diapos: readonly DiapoAffiche[];
  /** Pièce active au montage (retour sur l'accueil) ; lue une seule fois. */
  readonly lireIdInitial: () => string | null;
  /** Appelée à chaque changement de pièce active, pour la mémoriser. */
  readonly onAffiche: (id: string) => void;
  /** Ouvre la fiche de la pièce. */
  readonly onOuvrirPiece: (diapo: DiapoAffiche) => void;
  /** Ouvre la fiche d'une séance précise ; `cle` désigne l'élément qui retrouvera le focus au retour. */
  readonly onOuvrirSeance: (identifiant: string, cle: string) => void;
  /** Surtitre et titre de la page, au-dessus de l'affiche. */
  readonly introduction: ReactNode;
  /** Critères, bouton principal et « Préparer une autre sortie ». */
  readonly actions: ReactNode;
  /** « Depuis République à 18h30 » : rappel des critères sous le titre des séances. */
  readonly rappelCriteres: string;
}

const BOUTON_FLECHE =
  'grid size-11 place-items-center rounded-full border border-contour text-lg hover:bg-surface-survol aria-disabled:cursor-default aria-disabled:opacity-35 aria-disabled:hover:bg-transparent';

const OMBRE = 'shadow-[0_18px_36px_oklch(0.08_0.02_285/0.6)]';

const deuxChiffres = (n: number) => String(n).padStart(2, '0');

/**
 * Pièces à l'affiche : une affiche active à côté de son texte (titre, salle, séances), et ses voisines.
 * Une seule sélection (`indice`) commande le titre, les séances, le compteur, les flèches et la fiche ouverte ;
 * seule la manière de la changer dépend de la taille d'écran :
 *  - mobile et tablette (< 1100 px) : défilement natif avec accroche. L'affiche suit le doigt, les voisines se
 *    redressent progressivement, l'accroche native termine le geste, le défilement vertical reste libre. Mobile :
 *    affiche centrée entre deux voisines, texte dessous ; tablette : affiche à gauche (280 px), texte à droite ;
 *  - bureau (≥ 1100 px) : scène par indice, zone centrale plafonnée à 1100 px, une voisine de chaque côté ;
 *  - ultra-wide (≥ 2200 px) : zone plafonnée à 1560 px, deux voisines de chaque côté.
 * Le premier geste (souris ou doigt) sur une voisine la met à l'affiche ; l'affiche active ouvre sa fiche.
 * Au clavier, Entrée sur une voisine ouvre directement sa fiche. Les déplacements s'arrêtent aux bords.
 */
export function CarrouselAffiches({
  diapos,
  lireIdInitial,
  onAffiche,
  onOuvrirPiece,
  onOuvrirSeance,
  introduction,
  actions,
  rappelCriteres,
}: Props) {
  const bureau = useBureau();
  const ids = diapos.map((diapo) => diapo.id);
  const {
    indice,
    idActif,
    sens,
    reduire,
    allerA,
    suivreDefilement,
    programmeRef,
    pas,
    surTouche,
    surPression,
    surRelachement,
    aBalaye,
    focusSuitRef,
    peutReculer,
    peutAvancer,
  } = useCarrousel(ids, lireIdInitial);
  const actif = diapos[indice];
  const racine = useRef<HTMLElement>(null);
  const defileur = useRef<HTMLDivElement>(null);
  const boiteAffiche = useRef<HTMLDivElement>(null);
  const boiteTexte = useRef<HTMLDivElement>(null);
  const precedent = useRef(idActif);
  /** Jusqu'à cet instant, un défilement natif commandé par le programme ne doit pas changer la sélection. */
  const ignorerDefilementJusqua = useRef(0);

  /** Distance entre le centre de deux affiches voisines du défileur (largeur d'une affiche + espace). */
  const lirePas = (conteneur: HTMLElement): number => {
    const [premiere, seconde] = conteneur.querySelectorAll<HTMLElement>('[data-diapo]');
    if (premiere === undefined) {
      return 0;
    }
    return seconde === undefined ? premiere.offsetWidth : seconde.offsetLeft - premiere.offsetLeft;
  };

  useEffect(() => {
    if (idActif !== null) {
      onAffiche(idActif);
    }
  }, [idActif, onAffiche]);

  // Au passage sous 1100 px, au montage, ou quand la liste change (critères), le défileur retrouve la sélection
  // courante : celle-ci suit la pièce, pas l'indice, donc la même pièce reste centrée si elle change de position.
  const cleListe = ids.join('|');
  const restituerDefilement = useEffectEvent(() => {
    const conteneur = defileur.current;
    if (conteneur !== null) {
      conteneur.scrollLeft = indice * lirePas(conteneur);
    }
  });
  useLayoutEffect(() => {
    if (!bureau) {
      restituerDefilement();
    }
  }, [bureau, cleListe]);

  // Défilement natif : profondeur au fil du geste (l'affiche centrée est de face, les voisines inclinées et
  // assombries) et sélection = affiche la plus proche du centre.
  const suivreAffiche = useEffectEvent(() => {
    const conteneur = defileur.current;
    if (conteneur !== null && Date.now() >= ignorerDefilementJusqua.current) {
      suivreDefilement(indiceDepuisDefilement(conteneur.scrollLeft, lirePas(conteneur), diapos.length));
    }
  });
  useEffect(() => {
    const conteneur = defileur.current;
    if (bureau || conteneur === null) {
      return;
    }
    let image = 0;
    const appliquerProfondeur = () => {
      const milieu = conteneur.scrollLeft + conteneur.clientWidth / 2;
      for (const diapo of conteneur.querySelectorAll<HTMLElement>('[data-diapo]')) {
        const cible = diapo.querySelector<HTMLElement>('[data-profondeur]');
        if (cible === null) {
          continue;
        }
        if (reduire) {
          cible.style.transform = '';
          cible.style.filter = '';
          continue;
        }
        const ecart = Math.max(-2, Math.min(2, (diapo.offsetLeft + diapo.offsetWidth / 2 - milieu) / diapo.offsetWidth));
        const distance = Math.min(Math.abs(ecart), 1.5);
        cible.style.transform = `perspective(900px) rotateY(${(-ecart * 16).toFixed(2)}deg) scale(${(1 - distance * 0.1).toFixed(3)})`;
        cible.style.filter = `brightness(${(1 - Math.min(distance, 1) * 0.35).toFixed(3)})`;
      }
    };
    const planifier = () => {
      if (image !== 0) {
        return;
      }
      image = requestAnimationFrame(() => {
        image = 0;
        appliquerProfondeur();
        suivreAffiche();
      });
    };
    appliquerProfondeur();
    conteneur.addEventListener('scroll', planifier, { passive: true });
    const observateur = new ResizeObserver(planifier);
    observateur.observe(conteneur);
    return () => {
      conteneur.removeEventListener('scroll', planifier);
      observateur.disconnect();
      cancelAnimationFrame(image);
    };
  }, [bureau, reduire, diapos.length]);

  // Changement voulu (flèche, clavier, miniature, clic sur une voisine) : le défilement natif suit.
  useEffect(() => {
    if (!programmeRef.current) {
      return;
    }
    programmeRef.current = false;
    const conteneur = defileur.current;
    if (bureau || conteneur === null) {
      return;
    }
    ignorerDefilementJusqua.current = Date.now() + (reduire ? 0 : 700);
    conteneur.scrollTo({ left: indice * lirePas(conteneur), behavior: reduire ? 'auto' : 'smooth' });
  }, [indice, bureau, reduire, programmeRef]);

  // Changement d'affiche : le focus suit au clavier, et le texte (et, sur la scène, l'affiche) arrive du côté du déplacement.
  useEffect(() => {
    if (precedent.current === idActif) {
      return;
    }
    precedent.current = idActif;
    if (focusSuitRef.current) {
      focusSuitRef.current = false;
      if (idActif !== null) {
        racine.current?.querySelector<HTMLElement>(`[data-diapo][data-cle="${CSS.escape(idActif)}"]`)?.focus({ preventScroll: true });
      }
    }
    if (reduire) {
      return;
    }
    if (bureau) {
      boiteAffiche.current?.animate(
        [
          { opacity: 0, transform: `translateX(${String(sens * 56)}px) perspective(900px) rotateY(${String(-sens * 10)}deg) scale(0.96)` },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' },
      );
    }
    boiteTexte.current?.animate(
      [
        { opacity: 0, transform: `translateX(${String(sens * 22)}px)` },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 240, delay: 30, fill: 'backwards', easing: 'ease-out' },
    );
  }, [idActif, reduire, sens, bureau, focusSuitRef]);

  if (actif === undefined) {
    return (
      <section aria-label="Pièces à l’affiche" className="flex flex-col gap-4 px-4 py-4 tablette:px-8">
        {introduction}
        {actions}
      </section>
    );
  }

  const { avant, apres } = voisins(indice, diapos.length, 2);
  const voisine = (i: number) => diapos[i];

  /** Clic sur une voisine : souris ou doigt → elle passe à l'affiche ; clavier (Entrée, Espace) → ouvre sa fiche. */
  const surVoisine = (i: number) => (evenement: MouseEvent<HTMLButtonElement>) => {
    const diapo = voisine(i);
    if (diapo === undefined || aBalaye()) {
      return;
    }
    if (evenement.detail === 0) {
      onOuvrirPiece(diapo);
    } else {
      allerA(i);
    }
  };

  const colonneVoisines = (indices: readonly number[], cote: 'gauche' | 'droite') => (
    <div
      className={`hidden min-w-0 items-center gap-7 self-stretch overflow-hidden bureau:flex ultra:gap-12 ${cote === 'gauche' ? 'justify-end pr-7 ultra:pr-12' : 'justify-start pl-7 ultra:pl-12'}`}
    >
      {indices.map((i) => {
        const diapo = voisine(i);
        if (diapo === undefined) {
          return null;
        }
        const proche = Math.abs(i - indice) === 1;
        return (
          <button
            key={diapo.id}
            type="button"
            aria-label={`Mettre à l’affiche : ${diapo.titre}`}
            onClick={surVoisine(i)}
            className={`flex w-[240px] flex-none flex-col gap-2.5 p-0 text-left transition-opacity motion-reduce:transition-none hover:opacity-100 ultra:w-[320px] ${proche ? 'opacity-50 ultra:opacity-60' : 'opacity-[0.38] ultra:w-[250px]'} ${proche ? '' : 'hidden ultra:flex'}`}
          >
            <span className={`block w-full ${OMBRE}`}>
              <Affiche affiche={diapo.affiche} titre={diapo.titre} auteur={diapo.auteur} salle={diapo.salle} />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-editorial text-[22px] leading-[1.05] italic">{diapo.titre}</span>
              <span className="text-sm font-bold">{diapo.legende}</span>
            </span>
          </button>
        );
      })}
    </div>
  );

  /** Clic sur une affiche du défileur : souris ou doigt → centrée d'abord, ouverte si elle l'est déjà ; clavier → ouvre. */
  const surDiapo = (i: number, evenement: MouseEvent<HTMLAnchorElement>) => {
    surClicSimple<HTMLAnchorElement>((clic) => {
      const diapo = diapos[i];
      if (diapo === undefined) {
        return;
      }
      if (clic.detail === 0 || estCentree(clic.currentTarget)) {
        onOuvrirPiece(diapo);
      } else {
        allerA(i);
      }
    })(evenement);
  };

  const estCentree = (diapo: HTMLElement): boolean => {
    const conteneur = defileur.current;
    if (conteneur === null) {
      return false;
    }
    const zone = conteneur.getBoundingClientRect();
    const rect = diapo.getBoundingClientRect();
    return Math.abs(rect.left + rect.width / 2 - (zone.left + zone.width / 2)) < 4;
  };

  return (
    <section
      ref={racine}
      aria-roledescription="carrousel"
      aria-label="Pièces à l’affiche"
      onKeyDown={surTouche}
      onPointerDown={bureau ? surPression : undefined}
      onPointerUp={bureau ? surRelachement : undefined}
      className={`grid min-h-full grid-cols-1 content-center bureau:grid-cols-[minmax(0,1fr)_minmax(0,1100px)_minmax(0,1fr)] ultra:grid-cols-[minmax(0,1fr)_minmax(0,1560px)_minmax(0,1fr)] ${bureau ? 'touch-pan-y' : ''}`}
    >
      {bureau ? colonneVoisines(avant, 'gauche') : null}

      <div className="flex min-w-0 flex-col gap-3 px-4 py-3 tablette:gap-[22px] tablette:px-8 tablette:py-7 bureau:gap-5 bureau:px-0 ultra:gap-7 ultra:py-14">
        {introduction}
        <div className="grid gap-3 tablette:grid-cols-[280px_minmax(0,1fr)] tablette:items-start tablette:gap-9 bureau:grid-cols-[360px_minmax(0,1fr)] bureau:gap-[52px] ultra:grid-cols-[540px_minmax(0,1fr)] ultra:gap-24">
          <div className="flex min-w-0 flex-col gap-3.5">
            {bureau ? (
              <div ref={boiteAffiche} className={`relative z-[2] ${OMBRE}`}>
                <a
                  href={cheminCible({ type: 'piece', id: actif.id })}
                  data-diapo=""
                  data-cle={actif.id}
                  aria-label={`Ouvrir la fiche de ${actif.titre}`}
                  onClick={surClicSimple(() => {
                    // Le clic qui suit un balayage (souris ou doigt) n'ouvre rien.
                    if (!aBalaye()) {
                      onOuvrirPiece(actif);
                    }
                  })}
                  className="block"
                >
                  <Affiche affiche={actif.affiche} titre={actif.titre} auteur={actif.auteur} salle={actif.salle} />
                </a>
              </div>
            ) : (
              <div
                ref={defileur}
                className="relative -mx-4 flex snap-x snap-mandatory items-center gap-[18px] overflow-x-auto overflow-y-hidden pt-1 pb-1.5 [scrollbar-width:none] tablette:mx-0"
              >
                {diapos.map((diapo, i) => (
                  <a
                    key={diapo.id}
                    href={cheminCible({ type: 'piece', id: diapo.id })}
                    data-diapo=""
                    data-cle={diapo.id}
                    aria-label={`Ouvrir la fiche de ${diapo.titre}`}
                    // Seul le focus clavier (Tab) centre l'affiche : l'anneau de focus n'est jamais rogné. Le focus
                    // donné par la souris ou le doigt ne déplace rien ; le centrage se fait alors au clic.
                    onFocus={(evenement) => {
                      if (evenement.currentTarget.matches(':focus-visible')) {
                        allerA(i);
                      }
                    }}
                    onClick={(evenement) => {
                      surDiapo(i, evenement);
                    }}
                    className="block w-[190px] flex-none snap-center first:ml-[calc(50%-95px)] last:mr-[calc(50%-95px)] tablette:w-[280px] tablette:first:ml-0 tablette:last:mr-0"
                  >
                    <span data-profondeur="" className={`block w-full will-change-transform ${OMBRE}`}>
                      <Affiche affiche={diapo.affiche} titre={diapo.titre} auteur={diapo.auteur} salle={diapo.salle} />
                    </span>
                  </a>
                ))}
              </div>
            )}

            <div className="flex items-center justify-center gap-2.5 tablette:justify-start">
              <button
                type="button"
                aria-label="Affiche précédente"
                aria-disabled={!peutReculer}
                className={BOUTON_FLECHE}
                onClick={() => {
                  pas(-1);
                }}
              >
                ←
              </button>
              <span className="min-w-[4.5rem] text-center text-[13px] font-semibold tracking-[0.06em] text-texte-doux">
                {deuxChiffres(indice + 1)} / {deuxChiffres(diapos.length)}
              </span>
              <button
                type="button"
                aria-label="Affiche suivante"
                aria-disabled={!peutAvancer}
                className={BOUTON_FLECHE}
                onClick={() => {
                  pas(1);
                }}
              >
                →
              </button>
              <span className="hidden text-xs text-texte-doux bureau:inline">← → au clavier</span>
            </div>

            <div role="group" aria-label="Toutes les pièces à l’affiche" className="hidden gap-2.5 tablette:flex ultra:gap-3.5">
              {diapos.map((diapo, i) => (
                <button
                  key={diapo.id}
                  type="button"
                  aria-label={`${diapo.titre}, ${diapo.salle}`}
                  aria-current={i === indice}
                  onClick={() => {
                    allerA(i);
                  }}
                  className={`w-11 flex-none border-b-2 pb-1 transition-[opacity,translate] motion-reduce:transition-none ultra:w-[58px] ${i === indice ? '-translate-y-1 border-corail' : 'border-transparent opacity-50 hover:opacity-100'}`}
                >
                  <Affiche affiche={diapo.affiche} titre={diapo.titre} auteur={diapo.auteur} salle={diapo.salle} />
                </button>
              ))}
            </div>
            <p role="status" className="sr-only">
              {`${String(indice + 1)} sur ${String(diapos.length)} : ${actif.titre}, ${actif.salle}`}
            </p>
          </div>

          <div ref={boiteTexte} className="flex min-w-0 flex-col gap-[18px] tablette:gap-5 ultra:gap-7">
            <div className="order-1 flex flex-col gap-1.5">
              <p className="text-xs font-semibold tracking-[0.14em] text-texte-doux uppercase">{actif.auteurGenres}</p>
              <h2 className="font-editorial text-[40px] leading-none font-normal text-balance italic tablette:text-[52px] bureau:text-[66px] ultra:text-[108px]">
                {actif.titre}
              </h2>
              <p className="text-base font-semibold tablette:text-[17px] bureau:text-lg ultra:text-[22px]">{actif.salleQuartier}</p>
              <p className="text-sm text-texte-doux">{actif.adresseDuree}</p>
            </div>

            <p className="order-4 max-w-[46ch] text-[15px] leading-normal text-pretty tablette:order-2 tablette:text-base ultra:text-[19px]">
              {actif.synopsis}
            </p>

            <div className="order-3 flex flex-col gap-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b-2 border-texte pb-2">
                <h3 className="text-[13px] font-bold tracking-[0.14em] uppercase">{actif.enteteSeances}</h3>
                <p className="text-[13px] text-texte-doux">{rappelCriteres}</p>
              </div>
              <ul className="flex flex-wrap gap-2">
                {actif.seances.map((seance) => (
                  <li key={seance.id}>
                    <a
                      href={cheminCible({ type: 'seance', id: seance.id })}
                      data-cle={seance.cle}
                      onClick={surClicSimple(() => {
                        onOuvrirSeance(seance.id, seance.cle);
                      })}
                      className={`flex min-h-[88px] min-w-[150px] flex-col gap-1 rounded-md border bg-surface px-3.5 py-3 hover:bg-surface-survol ${seance.choisie ? 'border-2 border-texte' : 'border-contour'}`}
                    >
                      <span className="sr-only">{actif.titre}, séance de </span>
                      <span className="text-[26px] leading-none font-extrabold tracking-[-0.03em] ultra:text-4xl">{seance.heure}</span>
                      <span className="text-xs font-bold">{seance.sortie === null ? '→ sortie ?' : `→ sortie ${seance.sortie}`}</span>
                      <span className={`inline-flex items-center gap-[7px] text-[11px] font-bold tracking-[0.08em] uppercase ${TEXTE_GROUPE[seance.groupe]}`}>
                        <span aria-hidden="true" className={`size-2 flex-none rounded-full ${POINT_GROUPE[seance.groupe]}`} />
                        {LIBELLE_STATUT[seance.statut]}
                      </span>
                      {seance.choisie ? <span className="text-[11px] font-semibold text-texte-doux">Séance proposée</span> : null}
                    </a>
                  </li>
                ))}
              </ul>
              <a
                href={cheminCible({ type: 'piece', id: actif.id })}
                onClick={surClicSimple(() => {
                  onOuvrirPiece(actif);
                })}
                className="inline-flex min-h-11 items-center self-start text-[15px] font-bold underline underline-offset-4"
              >
                Voir la fiche de la pièce →
              </a>
            </div>

            <div className="order-2 flex flex-col gap-2 tablette:order-4 tablette:gap-2.5">{actions}</div>
          </div>
        </div>
      </div>

      {bureau ? colonneVoisines(apres, 'droite') : null}
    </section>
  );
}
