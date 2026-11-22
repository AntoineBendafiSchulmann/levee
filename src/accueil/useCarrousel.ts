import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

import { useMouvementReduit } from './useMediaQuery';

/** Ramène un indice dans `[0, nombre - 1]` (0 quand il n'y a aucune diapositive). */
export function borner(indice: number, nombre: number): number {
  return Math.max(0, Math.min(nombre - 1, indice));
}

/**
 * Sélection effective d'après la liste courante des pièces : la pièce choisie si elle y figure (même à une autre
 * position qu'avant), sinon la première pièce disponible (ordre de la liste) ; aucune si la liste est vide.
 */
export function resoudreSelection(ids: readonly string[], choisie: string | null): { id: string | null; indice: number } {
  const position = choisie === null ? -1 : ids.indexOf(choisie);
  const indice = Math.max(0, position);
  return { id: ids[indice] ?? null, indice };
}

export interface EtatFleches {
  readonly peutReculer: boolean;
  readonly peutAvancer: boolean;
}

/** Les flèches s'arrêtent aux bords : pas de défilement circulaire. Une seule affiche : aucun déplacement possible. */
export function etatFleches(indice: number, nombre: number): EtatFleches {
  return { peutReculer: indice > 0, peutAvancer: indice < nombre - 1 };
}

/**
 * Affiches voisines de l'affiche active, dans l'ordre d'affichage (de gauche à droite), limitées aux bords :
 * la première affiche n'a pas de voisine avant elle, la dernière pas de voisine après.
 */
export function voisins(indice: number, nombre: number, portee: number): { avant: number[]; apres: number[] } {
  const avant: number[] = [];
  const apres: number[] = [];
  for (let distance = portee; distance >= 1; distance -= 1) {
    if (indice - distance >= 0) {
      avant.push(indice - distance);
    }
  }
  for (let distance = 1; distance <= portee; distance += 1) {
    if (indice + distance <= nombre - 1) {
      apres.push(indice + distance);
    }
  }
  return { avant, apres };
}

/**
 * Affiche la plus proche du centre d'après le défilement natif : chaque affiche est centrée à
 * `indice × pas` (les marges des extrémités centrent la première et la dernière). Sans pas mesurable : 0.
 */
export function indiceDepuisDefilement(defilement: number, pas: number, nombre: number): number {
  return pas <= 0 ? 0 : borner(Math.round(defilement / pas), nombre);
}

/** Indice visé par une touche de navigation (← → Début Fin), ou `null` pour toute autre touche. */
export function indiceApresTouche(touche: string, indice: number, nombre: number): number | null {
  switch (touche) {
    case 'ArrowLeft':
      return borner(indice - 1, nombre);
    case 'ArrowRight':
      return borner(indice + 1, nombre);
    case 'Home':
      return 0;
    case 'End':
      return Math.max(0, nombre - 1);
    default:
      return null;
  }
}

/** Seuil, en pixels, au-delà duquel un geste horizontal est un balayage et non un toucher. */
export const SEUIL_BALAYAGE_PX = 48;

/** Glisser vers la gauche (déplacement négatif) avance d'une affiche, vers la droite recule. */
export function sensBalayage(deplacement: number): -1 | 0 | 1 {
  if (Math.abs(deplacement) <= SEUIL_BALAYAGE_PX) {
    return 0;
  }
  return deplacement < 0 ? 1 : -1;
}

interface Etat {
  /** Pièce choisie : l'indice se déduit de la liste courante, il ne se mémorise pas. */
  readonly id: string | null;
  /** Sens du dernier déplacement, pour orienter l'animation d'arrivée. */
  readonly sens: 1 | -1;
}

/**
 * Logique du carrousel d'affiches : une pièce active (identifiée par son `id`, l'indice s'en déduit de la liste
 * courante), flèches, clavier et balayage. Les déplacements s'arrêtent aux bords. `lireIdInitial` n'est lu
 * qu'au montage. Si la pièce choisie disparaît de la liste, la première pièce disponible la remplace.
 */
export function useCarrousel(ids: readonly string[], lireIdInitial: () => string | null) {
  const reduire = useMouvementReduit();
  const [etat, setEtat] = useState<Etat>(() => ({ id: resoudreSelection(ids, lireIdInitial()).id, sens: 1 }));
  const { id: idActif, indice } = resoudreSelection(ids, etat.id);
  if (idActif !== null && idActif !== etat.id) {
    // La pièce choisie n'est plus dans la liste : la première pièce disponible devient la sélection.
    setEtat({ id: idActif, sens: 1 });
  }
  const nombre = ids.length;
  const departBalayage = useRef<number | null>(null);
  const aBalayeRef = useRef(false);
  /** Vrai juste après un balayage : le clic qui le suit ne doit ni ouvrir ni recentrer. */
  const aBalaye = useCallback(() => aBalayeRef.current, []);
  /** Vrai quand le déplacement vient du clavier : le focus suit alors l'affiche active. */
  const focusSuitRef = useRef(false);
  /** Vrai quand le changement d'affiche est voulu (flèche, clavier, miniature, clic) : le défilement natif doit alors suivre. */
  const programmeRef = useRef(false);

  const changer = useCallback(
    (cible: number) => {
      const id = ids[borner(cible, ids.length)];
      if (id === undefined) {
        return;
      }
      setEtat((precedent) =>
        precedent.id === id ? precedent : { id, sens: ids.indexOf(id) > ids.indexOf(precedent.id ?? id) ? 1 : -1 },
      );
    },
    [ids],
  );

  const allerA = useCallback(
    (cible: number) => {
      if (borner(cible, nombre) !== indice) {
        programmeRef.current = true;
      }
      changer(cible);
    },
    [changer, indice, nombre],
  );

  /** Le défilement natif a amené une autre affiche au centre : la sélection suit, sans relancer de défilement. */
  const suivreDefilement = changer;

  const pas = useCallback(
    (sens: -1 | 1) => {
      allerA(indice + sens);
    },
    [allerA, indice],
  );

  const surTouche = useCallback(
    (evenement: KeyboardEvent<HTMLElement>) => {
      const cible = evenement.target;
      if (cible instanceof HTMLInputElement || cible instanceof HTMLSelectElement || cible instanceof HTMLTextAreaElement) {
        return;
      }
      const visee = indiceApresTouche(evenement.key, indice, nombre);
      if (visee === null) {
        return;
      }
      evenement.preventDefault();
      // Une commande sans effet (butée) ne doit pas programmer un transfert de focus pour l'action suivante.
      if (visee !== indice) {
        focusSuitRef.current = true;
        allerA(visee);
      }
    },
    [allerA, indice, nombre],
  );

  const surPression = useCallback((evenement: PointerEvent<HTMLElement>) => {
    departBalayage.current = evenement.clientX;
    aBalayeRef.current = false;
  }, []);

  const surRelachement = useCallback(
    (evenement: PointerEvent<HTMLElement>) => {
      const depart = departBalayage.current;
      departBalayage.current = null;
      if (depart === null) {
        return;
      }
      const sens = sensBalayage(evenement.clientX - depart);
      if (sens !== 0) {
        // Le clic qui suit le geste ne doit ni ouvrir ni recentrer.
        aBalayeRef.current = true;
        setTimeout(() => {
          aBalayeRef.current = false;
        }, 60);
        pas(sens);
      }
    },
    [pas],
  );

  return {
    indice,
    idActif,
    sens: etat.sens,
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
    ...etatFleches(indice, nombre),
  };
}
