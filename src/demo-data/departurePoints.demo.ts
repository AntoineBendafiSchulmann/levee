import type { DeparturePoint } from '../domain/types';

/* FICTITIOUS DATA — suggested departure points; travel routes exist for each (see venues.demo.ts). */
export const DEMO_DEPARTURE_POINTS: readonly DeparturePoint[] = [
  { id: 'republique', label: 'République' },
  { id: 'bastille', label: 'Bastille' },
  { id: 'chatelet', label: 'Châtelet' },
  { id: 'gare-de-lyon', label: 'Gare de Lyon' },
  { id: 'abbesses', label: 'Abbesses' },
];
