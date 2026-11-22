import type { Salle, Trajet } from '../domaine/types';

/*
 * DONNÉES FICTIVES — salles imaginaires, adresses et trajets estimés, démonstration.
 * Un trajet est une estimation en minutes (avec sa description et une distance à titre indicatif),
 * pas un calcul d'itinéraire. Ordre : République, Bastille, Châtelet, Gare de Lyon, Abbesses.
 */
type Estimation = readonly [minutes: number, distanceKm: number, description: string];

function trajets(republique: Estimation, bastille: Estimation, chatelet: Estimation, gareDeLyon: Estimation, abbesses: Estimation) {
  const trajet = ([minutes, distanceKm, description]: Estimation): Trajet => ({ minutes, distanceKm, description });
  return {
    republique: trajet(republique),
    bastille: trajet(bastille),
    chatelet: trajet(chatelet),
    'gare-de-lyon': trajet(gareDeLyon),
    abbesses: trajet(abbesses),
  };
}

export const DEMO_SALLES: readonly Salle[] = [
  {
    id: 'ambroise',
    nom: 'Théâtre Saint-Ambroise',
    quartier: 'Paris 11e',
    adresse: '12 rue Saint-Ambroise',
    trajets: trajets(
      [14, 1.3, 'Métro 9 puis 6 min à pied'],
      [11, 1.4, 'Métro 5 puis 5 min à pied'],
      [19, 3.2, 'Métro 11, correspondance'],
      [17, 2.3, 'Bus 87 puis 4 min à pied'],
      [31, 4.6, 'Métro 12, correspondance'],
    ),
  },
  {
    id: 'faubourg',
    nom: 'Le Petit Faubourg',
    quartier: 'Paris 10e',
    adresse: '27 rue du Faubourg-du-Temple',
    trajets: trajets(
      [5, 0.35, 'À pied'],
      [16, 2.1, 'Métro 5 puis 4 min à pied'],
      [15, 2.6, 'Métro 11 puis 3 min à pied'],
      [20, 2.9, 'Métro 5'],
      [24, 3.4, 'Métro 2, correspondance'],
    ),
  },
  {
    id: 'rotonde',
    nom: 'Théâtre de la Rotonde',
    quartier: 'Paris 20e',
    adresse: '4 place de la Rotonde',
    trajets: trajets(
      [18, 2.4, 'Métro 11 puis 7 min à pied'],
      [21, 3.0, 'Bus 76'],
      [23, 4.1, 'Métro 11'],
      [25, 3.6, 'Métro 1, correspondance'],
      [27, 4.4, 'Métro 2'],
    ),
  },
  {
    id: 'boulevards',
    nom: 'Comédie des Boulevards',
    quartier: 'Paris 9e',
    adresse: '38 boulevard Poissonnière',
    trajets: trajets(
      [25, 2.1, 'Métro 9 à vitesse réduite, puis 8 min à pied'],
      [28, 3.3, 'Métro 8 puis 6 min à pied'],
      [15, 1.8, 'Métro 4 puis 5 min à pied'],
      [27, 3.4, 'Métro 14, correspondance'],
      [14, 1.9, 'Métro 12 puis 4 min à pied'],
    ),
  },
  {
    id: 'canal',
    nom: 'Théâtre du Canal',
    quartier: 'Paris 19e',
    adresse: '61 quai de la Loire',
    trajets: trajets(
      [16, 1.9, 'Bus 75 puis 4 min à pied'],
      [24, 3.4, 'Métro 5'],
      [22, 3.8, 'Métro 7'],
      [25, 3.9, 'Métro 5, correspondance'],
      [20, 2.8, 'Métro 2'],
    ),
  },
  {
    id: 'recollets',
    nom: 'Salle des Récollets',
    quartier: 'Paris 10e',
    adresse: '150 rue du Faubourg-Saint-Martin',
    trajets: trajets(
      [12, 1.1, 'Métro 5 puis 5 min à pied'],
      [18, 2.9, 'Métro 5'],
      [17, 2.7, 'Métro 4'],
      [19, 3.2, 'Métro 5'],
      [19, 2.5, 'Métro 2, correspondance'],
    ),
  },
];
