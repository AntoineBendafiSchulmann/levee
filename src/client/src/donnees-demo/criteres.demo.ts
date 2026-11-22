import type { CriteresSortie, JourIso } from '../domaine/types';

/*
 * DONNÉES FICTIVES — démonstration.
 * Le « jour courant » est figé : « ce soir » désigne ici le jeudi 26 novembre 2026,
 * quelle que soit la date réelle. À remplacer quand les données viendront du BFF.
 */
export const DEMO_AUJOURDHUI: JourIso = '2026-11-26';

export const DEMO_CRITERES_INITIAUX: CriteresSortie = {
  jour: DEMO_AUJOURDHUI,
  origine: 'republique',
  departMinutes: 18 * 60 + 30,
  limiteMinutes: 22 * 60,
  genres: [],
  auteur: '',
  masquerImpossibles: false,
};

/** Raccourcis proposés sous le champ « Auteur ». */
export const DEMO_AUTEURS_SUGGERES: readonly string[] = ['Molière', 'Marivaux', 'Rostand'];
