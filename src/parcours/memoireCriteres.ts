import {
  DEPART_MAX_MINUTES,
  DEPART_MIN_MINUTES,
  LIMITE_MAX_MINUTES,
  LIMITE_MIN_MINUTES,
  PAS_HEURE_MINUTES,
} from '../domaine/criteres';
import { GENRES } from '../domaine/genres';
import type { CriteresSortie, JourIso, Origine } from '../domaine/types';

/** Clé du `sessionStorage` : les critères de la sortie, pour la durée de l'onglet seulement. */
export const CLE_CRITERES = 'levee:criteres';

/** Ce que le domaine accepte : les jours programmés et les points de départ connus. */
export interface ContraintesCriteres {
  readonly jours: readonly JourIso[];
  readonly origines: readonly Origine[];
}

/** La partie de `Storage` utilisée ici ; un autre objet de même forme sert aux tests. */
export interface Stockage {
  getItem: (cle: string) => string | null;
  setItem: (cle: string, valeur: string) => void;
}

const estMinutesValides = (valeur: unknown, min: number, max: number): valeur is number =>
  typeof valeur === 'number' &&
  Number.isInteger(valeur) &&
  valeur >= min &&
  valeur <= max &&
  (valeur - min) % PAS_HEURE_MINUTES === 0;

/**
 * Un JSON lisible n'est pas forcément un jeu de critères acceptable : jour non programmé, origine inconnue,
 * heure hors bornes ou hors pas de 5 minutes, genre inconnu, mauvais type. Renvoie les critères tels qu'ils
 * seraient saisis dans l'interface, ou `null` si une seule valeur est refusée (jamais de correction partielle).
 */
export function criteresValides(valeur: unknown, contraintes: ContraintesCriteres): CriteresSortie | null {
  if (typeof valeur !== 'object' || valeur === null) {
    return null;
  }
  const { jour, origine, departMinutes, limiteMinutes, genres, auteur, masquerImpossibles } = valeur as Record<string, unknown>;
  const genresConnus: readonly unknown[] = GENRES.map((g) => g.id);
  if (
    typeof jour !== 'string' ||
    !contraintes.jours.includes(jour) ||
    typeof origine !== 'string' ||
    !contraintes.origines.some((o) => o.id === origine) ||
    !estMinutesValides(departMinutes, DEPART_MIN_MINUTES, DEPART_MAX_MINUTES) ||
    !estMinutesValides(limiteMinutes, LIMITE_MIN_MINUTES, LIMITE_MAX_MINUTES) ||
    !Array.isArray(genres) ||
    !genres.every((g) => genresConnus.includes(g)) ||
    new Set<unknown>(genres).size !== genres.length ||
    typeof auteur !== 'string' ||
    typeof masquerImpossibles !== 'boolean'
  ) {
    return null;
  }
  return {
    jour,
    origine,
    departMinutes,
    limiteMinutes,
    genres: GENRES.map((g) => g.id).filter((id) => genres.includes(id)),
    auteur,
    masquerImpossibles,
  };
}

/** Le `sessionStorage` du navigateur, ou `undefined` s'il est inaccessible (accès refusé, mode privé strict). */
export function stockageOnglet(): Stockage | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

/** Critères mémorisés dans l'onglet ; `undefined` si rien, illisible, refusé par le domaine ou stockage inaccessible. */
export function lireCriteres(stockage: Stockage | undefined, contraintes: ContraintesCriteres): CriteresSortie | undefined {
  try {
    const brut = stockage?.getItem(CLE_CRITERES) ?? null;
    return brut === null ? undefined : (criteresValides(JSON.parse(brut), contraintes) ?? undefined);
  } catch {
    return undefined;
  }
}

/** Mémorise les critères ; sans effet si le stockage est inaccessible ou plein. */
export function ecrireCriteres(stockage: Stockage | undefined, criteres: CriteresSortie): void {
  try {
    stockage?.setItem(CLE_CRITERES, JSON.stringify(criteres));
  } catch {
    // Les critères restent en mémoire pour cette session de la page : seul le rechargement les oublie.
  }
}
