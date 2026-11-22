import type { Salle } from '../domaine/types';

/*
 * DONNÉES FICTIVES — salles imaginaires et trajets estimés, démonstration.
 * Un trajet est une estimation en minutes, pas un calcul d'itinéraire. Ordre : République, Bastille,
 * Châtelet, Gare de Lyon, Abbesses.
 */
function trajets(republique: number, bastille: number, chatelet: number, gareDeLyon: number, abbesses: number) {
  return {
    republique: { minutes: republique },
    bastille: { minutes: bastille },
    chatelet: { minutes: chatelet },
    'gare-de-lyon': { minutes: gareDeLyon },
    abbesses: { minutes: abbesses },
  };
}

export const DEMO_SALLES: readonly Salle[] = [
  { id: 'ambroise', nom: 'Théâtre Saint-Ambroise', quartier: 'Paris 11e', trajets: trajets(14, 11, 19, 17, 31) },
  { id: 'faubourg', nom: 'Le Petit Faubourg', quartier: 'Paris 10e', trajets: trajets(5, 16, 15, 20, 24) },
  { id: 'rotonde', nom: 'Théâtre de la Rotonde', quartier: 'Paris 20e', trajets: trajets(18, 21, 23, 25, 27) },
  { id: 'boulevards', nom: 'Comédie des Boulevards', quartier: 'Paris 9e', trajets: trajets(25, 28, 15, 27, 14) },
  { id: 'canal', nom: 'Théâtre du Canal', quartier: 'Paris 19e', trajets: trajets(16, 24, 22, 25, 20) },
  { id: 'recollets', nom: 'Salle des Récollets', quartier: 'Paris 10e', trajets: trajets(12, 18, 17, 19, 19) },
];
