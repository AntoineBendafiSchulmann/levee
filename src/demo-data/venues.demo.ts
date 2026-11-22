import type { Venue, TravelEstimate } from '../domain/types';

/*
 * FICTITIOUS DATA — imaginary venues, addresses and estimated travel, demo.
 * A trip is an estimate in minutes (with its description and an indicative distance),
 * not a route calculation. Order: République, Bastille, Châtelet, Gare de Lyon, Abbesses.
 */
type TravelTuple = readonly [minutes: number, distanceKm: number, description: string];

function travelEstimates(republique: TravelTuple, bastille: TravelTuple, chatelet: TravelTuple, gareDeLyon: TravelTuple, abbesses: TravelTuple) {
  const travelEstimate = ([minutes, distanceKm, description]: TravelTuple): TravelEstimate => ({ minutes, distanceKm, description });
  return {
    republique: travelEstimate(republique),
    bastille: travelEstimate(bastille),
    chatelet: travelEstimate(chatelet),
    'gare-de-lyon': travelEstimate(gareDeLyon),
    abbesses: travelEstimate(abbesses),
  };
}

export const DEMO_VENUES: readonly Venue[] = [
  {
    id: 'ambroise',
    name: 'Théâtre Saint-Ambroise',
    district: 'Paris 11e',
    address: '12 rue Saint-Ambroise',
    travelEstimates: travelEstimates(
      [14, 1.3, 'Métro 9 puis 6 min à pied'],
      [11, 1.4, 'Métro 5 puis 5 min à pied'],
      [19, 3.2, 'Métro 11, correspondance'],
      [17, 2.3, 'Bus 87 puis 4 min à pied'],
      [31, 4.6, 'Métro 12, correspondance'],
    ),
  },
  {
    id: 'faubourg',
    name: 'Le Petit Faubourg',
    district: 'Paris 10e',
    address: '27 rue du Faubourg-du-Temple',
    travelEstimates: travelEstimates(
      [5, 0.35, 'À pied'],
      [16, 2.1, 'Métro 5 puis 4 min à pied'],
      [15, 2.6, 'Métro 11 puis 3 min à pied'],
      [20, 2.9, 'Métro 5'],
      [24, 3.4, 'Métro 2, correspondance'],
    ),
  },
  {
    id: 'rotonde',
    name: 'Théâtre de la Rotonde',
    district: 'Paris 20e',
    address: '4 place de la Rotonde',
    travelEstimates: travelEstimates(
      [18, 2.4, 'Métro 11 puis 7 min à pied'],
      [21, 3.0, 'Bus 76'],
      [23, 4.1, 'Métro 11'],
      [25, 3.6, 'Métro 1, correspondance'],
      [27, 4.4, 'Métro 2'],
    ),
  },
  {
    id: 'boulevards',
    name: 'Comédie des Boulevards',
    district: 'Paris 9e',
    address: '38 boulevard Poissonnière',
    travelEstimates: travelEstimates(
      [25, 2.1, 'Métro 9 à vitesse réduite, puis 8 min à pied'],
      [28, 3.3, 'Métro 8 puis 6 min à pied'],
      [15, 1.8, 'Métro 4 puis 5 min à pied'],
      [27, 3.4, 'Métro 14, correspondance'],
      [14, 1.9, 'Métro 12 puis 4 min à pied'],
    ),
  },
  {
    id: 'canal',
    name: 'Théâtre du Canal',
    district: 'Paris 19e',
    address: '61 quai de la Loire',
    travelEstimates: travelEstimates(
      [16, 1.9, 'Bus 75 puis 4 min à pied'],
      [24, 3.4, 'Métro 5'],
      [22, 3.8, 'Métro 7'],
      [25, 3.9, 'Métro 5, correspondance'],
      [20, 2.8, 'Métro 2'],
    ),
  },
  {
    id: 'recollets',
    name: 'Salle des Récollets',
    district: 'Paris 10e',
    address: '150 rue du Faubourg-Saint-Martin',
    travelEstimates: travelEstimates(
      [12, 1.1, 'Métro 5 puis 5 min à pied'],
      [18, 2.9, 'Métro 5'],
      [17, 2.7, 'Métro 4'],
      [19, 3.2, 'Métro 5'],
      [19, 2.5, 'Métro 2, correspondance'],
    ),
  },
];
