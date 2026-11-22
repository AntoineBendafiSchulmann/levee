import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react';

const REQUETE_MOUVEMENT_REDUIT = '(prefers-reduced-motion: reduce)';

function abonner(notifier: () => void): () => void {
  const requete = window.matchMedia(REQUETE_MOUVEMENT_REDUIT);
  requete.addEventListener('change', notifier);
  return () => {
    requete.removeEventListener('change', notifier);
  };
}

/** Vrai quand l'utilisateur demande moins de mouvement ; suit un changement en cours de session. */
export function useMouvementReduit(): boolean {
  return useSyncExternalStore(
    abonner,
    () => window.matchMedia(REQUETE_MOUVEMENT_REDUIT).matches,
    () => false,
  );
}

function borner(valeur: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valeur));
}

/** Marge de tolérance (px) sur la position de défilement : les positions sont fractionnaires selon le zoom. */
const TOLERANCE_PX = 2;

export interface EtatFleches {
  readonly peutReculer: boolean;
  readonly peutAvancer: boolean;
}

/**
 * Déplacements réellement possibles d'après la position de défilement. Les marges des extrémités centrent la
 * première et la dernière affiche : le premier arrêt est à 0, le dernier à `scrollWidth - clientWidth`. Si tout
 * tient dans le défileur (rien à défiler), aucun déplacement n'est possible.
 */
export function etatFleches(scrollLeft: number, scrollWidth: number, clientWidth: number): EtatFleches {
  const maximum = scrollWidth - clientWidth;
  if (maximum <= TOLERANCE_PX) {
    return { peutReculer: false, peutAvancer: false };
  }
  return { peutReculer: scrollLeft > TOLERANCE_PX, peutAvancer: scrollLeft < maximum - TOLERANCE_PX };
}

/** Vrai si la diapositive est entièrement dans la partie visible du défileur (ni hors de vue ni rognée). */
export function estEntierementVisible(debut: number, largeur: number, scrollLeft: number, clientWidth: number): boolean {
  return debut - scrollLeft >= -TOLERANCE_PX && debut + largeur - scrollLeft <= clientWidth + TOLERANCE_PX;
}

/**
 * Logique du carrousel d'affiches : défilement natif avec accroche (scroll-snap), profondeur pilotée
 * par la position de défilement, flèches et clavier. Chaque diapositive est un élément
 * `[data-diapo]` (focusable) qui contient un élément `[data-profondeur]` à incliner.
 *
 * @param nombre Nombre de diapositives : relance le calcul de profondeur quand il change.
 */
export function useCarrousel(nombre: number) {
  const reduire = useMouvementReduit();
  const defileurRef = useRef<HTMLDivElement>(null);
  const [fleches, setFleches] = useState<EtatFleches>({ peutReculer: false, peutAvancer: false });

  const diapos = useCallback((): HTMLElement[] => {
    const defileur = defileurRef.current;
    return defileur === null ? [] : Array.from(defileur.querySelectorAll<HTMLElement>('[data-diapo]'));
  }, []);

  /** Une affiche latérale se redresse, s'éclaire et grandit à mesure qu'elle approche du centre. */
  const appliquerProfondeur = useCallback(() => {
    const defileur = defileurRef.current;
    if (defileur === null) {
      return;
    }
    const milieu = defileur.scrollLeft + defileur.clientWidth / 2;
    for (const diapo of diapos()) {
      const cible = diapo.querySelector<HTMLElement>('[data-profondeur]');
      if (cible === null) {
        continue;
      }
      if (reduire) {
        cible.style.transform = '';
        cible.style.filter = '';
        continue;
      }
      const ecart = borner((diapo.offsetLeft + diapo.offsetWidth / 2 - milieu) / diapo.offsetWidth, -2, 2);
      const distance = Math.min(Math.abs(ecart), 1.5);
      cible.style.transform = `perspective(900px) rotateY(${(-ecart * 16).toFixed(2)}deg) scale(${(1 - distance * 0.1).toFixed(3)})`;
      cible.style.filter = `brightness(${(1 - Math.min(distance, 1) * 0.35).toFixed(3)})`;
    }
  }, [diapos, reduire]);

  /** Met à jour l'état des flèches d'après le défilement réel (position, taille, nombre d'affiches). */
  const actualiserFleches = useCallback(() => {
    const defileur = defileurRef.current;
    if (defileur === null) {
      return;
    }
    const etat = etatFleches(defileur.scrollLeft, defileur.scrollWidth, defileur.clientWidth);
    setFleches((precedent) =>
      precedent.peutReculer === etat.peutReculer && precedent.peutAvancer === etat.peutAvancer ? precedent : etat,
    );
  }, []);

  useEffect(() => {
    const defileur = defileurRef.current;
    if (defileur === null) {
      return;
    }
    let image = 0;
    const planifier = () => {
      if (image !== 0) {
        return;
      }
      image = requestAnimationFrame(() => {
        image = 0;
        appliquerProfondeur();
        actualiserFleches();
      });
    };
    appliquerProfondeur();
    planifier();
    defileur.addEventListener('scroll', planifier, { passive: true });
    const observateur = new ResizeObserver(planifier);
    observateur.observe(defileur);
    return () => {
      defileur.removeEventListener('scroll', planifier);
      observateur.disconnect();
      cancelAnimationFrame(image);
    };
  }, [appliquerProfondeur, actualiserFleches, nombre]);

  const comportement: ScrollBehavior = reduire ? 'auto' : 'smooth';

  /**
   * Flèches : avance d'une affiche (largeur d'une diapositive plus l'espace entre deux). Sans effet vers un bord
   * déjà atteint : la disponibilité est relue sur le défileur, pas sur l'état affiché.
   */
  const defiler = useCallback(
    (sens: -1 | 1) => {
      const defileur = defileurRef.current;
      const [premiere, seconde] = diapos();
      if (defileur === null || premiere === undefined) {
        return;
      }
      const possible = etatFleches(defileur.scrollLeft, defileur.scrollWidth, defileur.clientWidth);
      if (sens === -1 ? !possible.peutReculer : !possible.peutAvancer) {
        return;
      }
      const pas = seconde === undefined ? premiere.offsetWidth : seconde.offsetLeft - premiere.offsetLeft;
      defileur.scrollBy({ left: sens * pas, behavior: comportement });
    },
    [diapos, comportement],
  );

  const centrer = useCallback(
    (diapo: HTMLElement) => {
      diapo.scrollIntoView({ inline: 'center', block: 'nearest', behavior: comportement });
    },
    [comportement],
  );

  /** Au retour d'une fiche : ramène l'affiche d'origine au centre seulement si elle est hors de vue ou rognée. */
  const ramenerEnVue = useCallback(
    (diapo: HTMLElement) => {
      const defileur = defileurRef.current;
      if (defileur !== null && !estEntierementVisible(diapo.offsetLeft, diapo.offsetWidth, defileur.scrollLeft, defileur.clientWidth)) {
        centrer(diapo);
      }
    },
    [centrer],
  );

  const estCentree = useCallback((diapo: HTMLElement): boolean => {
    const defileur = defileurRef.current;
    if (defileur === null) {
      return false;
    }
    const milieu = defileur.scrollLeft + defileur.clientWidth / 2;
    return Math.abs(diapo.offsetLeft + diapo.offsetWidth / 2 - milieu) < 4;
  }, []);

  /** ← → Début Fin : déplacent le focus sur une autre affiche et la centrent, focus toujours visible. */
  const surTouche = useCallback(
    (evenement: KeyboardEvent<HTMLElement>) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(evenement.key)) {
        return;
      }
      const liste = diapos();
      const courante =
        evenement.target instanceof Element ? evenement.target.closest<HTMLElement>('[data-diapo]') : null;
      const index = courante === null ? -1 : liste.indexOf(courante);
      if (index === -1) {
        return;
      }
      const suivant = {
        ArrowLeft: Math.max(0, index - 1),
        ArrowRight: Math.min(liste.length - 1, index + 1),
        Home: 0,
        End: liste.length - 1,
      }[evenement.key];
      const cible = suivant === undefined ? undefined : liste[suivant];
      if (cible === undefined) {
        return;
      }
      evenement.preventDefault();
      cible.focus({ preventScroll: true });
      centrer(cible);
    },
    [diapos, centrer],
  );

  return { defileurRef, defiler, surTouche, centrer, estCentree, ramenerEnVue, ...fleches };
}
