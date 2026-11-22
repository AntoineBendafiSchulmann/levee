import type { Origine } from '../domaine/types';

/* DONNÉES FICTIVES — points de départ proposés ; des trajets existent pour chacun (voir salles.demo.ts). */
export const DEMO_ORIGINES: readonly Origine[] = [
  { id: 'republique', libelle: 'République' },
  { id: 'bastille', libelle: 'Bastille' },
  { id: 'chatelet', libelle: 'Châtelet' },
  { id: 'gare-de-lyon', libelle: 'Gare de Lyon' },
  { id: 'abbesses', libelle: 'Abbesses' },
];
