import type { Duree, Trajet } from './types';

/**
 * Une arrivée à moins de ce nombre de minutes du début est « serrée » (0 minute incluse).
 * À 10 minutes exactement, le qualificatif disparaît. Choix de présentation de la V1.
 */
export const SEUIL_ARRIVEE_SERREE_MINUTES = 10;

export type StatutSeance =
  | 'a-temps'
  | 'arrivee-serree'
  | 'fin-incertaine'
  | 'duree-inconnue'
  | 'trajet-inconnu'
  | 'arrivee-tardive'
  | 'fin-depassee';

export type GroupeSeance = 'possible' | 'a-verifier' | 'impossible';

export const GROUPE_DU_STATUT: Readonly<Record<StatutSeance, GroupeSeance>> = {
  'a-temps': 'possible',
  'arrivee-serree': 'a-verifier',
  'fin-incertaine': 'a-verifier',
  'duree-inconnue': 'a-verifier',
  'trajet-inconnu': 'a-verifier',
  'arrivee-tardive': 'impossible',
  'fin-depassee': 'impossible',
};

export interface EntreeEvaluation {
  /** Heure de début annoncée. */
  readonly debutMinutes: number;
  readonly durees: readonly Duree[];
  /** Trajet estimé ; `undefined` quand aucune estimation n'existe pour ce point de départ. */
  readonly trajet: Trajet | undefined;
  readonly departMinutes: number;
  readonly limiteMinutes: number;
}

export interface Evaluation {
  readonly statut: StatutSeance;
  readonly groupe: GroupeSeance;
  /** Trajet estimé. */
  readonly trajetMinutes: number | null;
  /** Arrivée estimée : départ + trajet. */
  readonly arriveeMinutes: number | null;
  /** Début annoncé moins arrivée estimée : négative quand on arrive après le début. */
  readonly margeArriveeMinutes: number | null;
  /** Fin calculée : début + durée annoncée. Deux durées différentes donnent une plage. */
  readonly fin: { readonly min: number; readonly max: number } | null;
}

/**
 * Classe une séance. Le premier cas vrai l'emporte :
 * arrivée après le début, trajet non estimé (sauf fin déjà dépassée), durée inconnue,
 * fin dépassée, fin incertaine (seule la durée courte respecte la limite), arrivée serrée, à temps.
 * Une fin exactement à la limite est compatible.
 */
export function evaluerSeance(entree: EntreeEvaluation): Evaluation {
  const { debutMinutes, durees, trajet, departMinutes, limiteMinutes } = entree;
  const trajetMinutes = trajet?.minutes ?? null;
  const arriveeMinutes = trajetMinutes === null ? null : departMinutes + trajetMinutes;
  const margeArriveeMinutes = arriveeMinutes === null ? null : debutMinutes - arriveeMinutes;
  const minutes = durees.map((duree) => duree.minutes);
  const fin =
    minutes.length === 0
      ? null
      : { min: debutMinutes + Math.min(...minutes), max: debutMinutes + Math.max(...minutes) };

  let statut: StatutSeance;
  if (margeArriveeMinutes !== null && margeArriveeMinutes < 0) {
    statut = 'arrivee-tardive';
  } else if (margeArriveeMinutes === null) {
    statut = fin !== null && fin.min > limiteMinutes ? 'fin-depassee' : 'trajet-inconnu';
  } else if (fin === null) {
    statut = 'duree-inconnue';
  } else if (fin.min > limiteMinutes) {
    statut = 'fin-depassee';
  } else if (fin.max > limiteMinutes) {
    statut = 'fin-incertaine';
  } else if (margeArriveeMinutes < SEUIL_ARRIVEE_SERREE_MINUTES) {
    statut = 'arrivee-serree';
  } else {
    statut = 'a-temps';
  }

  return {
    statut,
    groupe: GROUPE_DU_STATUT[statut],
    trajetMinutes,
    arriveeMinutes,
    margeArriveeMinutes,
    fin,
  };
}
