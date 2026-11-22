import { useCallback, useEffect, useRef, useSyncExternalStore, type KeyboardEvent } from 'react';

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
      });
    };
    appliquerProfondeur();
    defileur.addEventListener('scroll', planifier, { passive: true });
    const observateur = new ResizeObserver(planifier);
    observateur.observe(defileur);
    return () => {
      defileur.removeEventListener('scroll', planifier);
      observateur.disconnect();
      cancelAnimationFrame(image);
    };
  }, [appliquerProfondeur, nombre]);

  const comportement: ScrollBehavior = reduire ? 'auto' : 'smooth';

  /** Flèches : avance d'une affiche (largeur d'une diapositive plus l'espace entre deux). */
  const defiler = useCallback(
    (sens: -1 | 1) => {
      const defileur = defileurRef.current;
      const [premiere, seconde] = diapos();
      if (defileur === null || premiere === undefined) {
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

  return { defileurRef, defiler, surTouche, centrer, estCentree };
}
