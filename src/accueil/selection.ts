import type { ResultatSeance, Resultats } from '../domaine/resultats';

/** Nombre maximal de séances proposées sous l'accueil. */
export const SELECTION_MAX = 3;

/**
 * Les séances « qui rentrent dans la soirée » : les premières séances possibles (À temps) des résultats déjà
 * calculés, dans leur ordre (par heure de début, puis par titre). Deux représentations d'une même pièce le
 * même jour sont deux entrées, chacune avec son identifiant.
 */
export function selectionSoiree(resultats: Resultats): ResultatSeance[] {
  return resultats.visibles.filter((r) => r.evaluation.groupe === 'possible').slice(0, SELECTION_MAX);
}
