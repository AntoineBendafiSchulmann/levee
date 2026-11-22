import type { CriteresSortie, JourIso } from '../domaine/types';

/*
 * DONNÉES FICTIVES — démonstration du lot 1.
 * Le « jour courant » est figé : « ce soir » désigne ici le jeudi 26 novembre 2026,
 * quelle que soit la date réelle. À remplacer quand les données viendront du BFF.
 */
export const DEMO_AUJOURDHUI: JourIso = '2026-11-26';

export const DEMO_CRITERES_INITIAUX: CriteresSortie = {
  jour: DEMO_AUJOURDHUI,
  origine: 'République',
  limiteMinutes: 22 * 60,
};
