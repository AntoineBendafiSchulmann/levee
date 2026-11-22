import type { GroupeSeance, StatutSeance } from '../domaine/evaluation';

/** Libellé affiché d'un statut : le même sur les cartes de résultats et sur la fiche. */
export const LIBELLE_STATUT: Readonly<Record<StatutSeance, string>> = {
  'a-temps': 'À temps',
  'arrivee-serree': 'Arrivée serrée',
  'fin-incertaine': 'Fin incertaine',
  'duree-inconnue': 'Durée inconnue',
  'trajet-inconnu': 'Trajet non estimé',
  'arrivee-tardive': 'Commence avant votre arrivée',
  'fin-depassee': 'Finit après votre limite',
};

/** Couleur du texte selon le groupe. */
export const TEXTE_GROUPE: Readonly<Record<GroupeSeance, string>> = {
  possible: 'text-ok',
  'a-verifier': 'text-attention',
  impossible: 'text-danger',
};

/** Couleur de fond du point de statut selon le groupe. */
export const POINT_GROUPE: Readonly<Record<GroupeSeance, string>> = {
  possible: 'bg-ok',
  'a-verifier': 'bg-attention',
  impossible: 'bg-danger',
};

/** Couleur de la bordure d'un message (verdict) selon le groupe. */
export const BORDURE_GROUPE: Readonly<Record<GroupeSeance, string>> = {
  possible: 'border-ok',
  'a-verifier': 'border-attention',
  impossible: 'border-danger',
};
