import { DEMO_CRITERES_INITIAUX } from '../donnees-demo/criteres.demo';
import { DEMO_SPECTACLES } from '../donnees-demo/spectacles.demo';
import { construireResultats, type ResultatSeance } from '../domaine/resultats';
import type { CriteresSortie, Duree, Salle, Spectacle } from '../domaine/types';

const trouve = DEMO_SPECTACLES.find((s) => s.id === 'jeu-amour-hasard');
if (trouve === undefined) {
  throw new Error('Spectacle de démonstration introuvable.');
}
const MODELE: Spectacle = trouve;

export const DEUX_DUREES: readonly Duree[] = [
  { minutes: 105, source: 'Site du théâtre' },
  { minutes: 115, source: 'Billetterie partenaire' },
];

export interface Cas {
  readonly durees: readonly Duree[];
  /** Début de la séance du samedi 28 novembre, en minutes depuis minuit. */
  readonly debutMinutes: number;
  readonly limiteMinutes: number;
  readonly avecTrajet: boolean;
}

export const CRITERES_SAMEDI: CriteresSortie = { ...DEMO_CRITERES_INITIAUX, jour: '2026-11-28' };

/** Un résultat de séance fabriqué pour un cas précis (départ République 18h30). */
export function resultatPour(cas: Cas): { resultat: ResultatSeance; criteres: CriteresSortie } {
  const salle: Salle = {
    id: 'salle-x',
    nom: 'Salle X',
    quartier: 'Paris 1er',
    adresse: '1 rue de Test',
    trajets: cas.avecTrajet ? { republique: { minutes: 18 } } : {},
  };
  const spectacle: Spectacle = {
    ...MODELE,
    id: 'x',
    salleId: salle.id,
    durees: cas.durees,
    seances: [{ jour: '2026-11-28', debutMinutes: cas.debutMinutes }],
  };
  const criteres = { ...CRITERES_SAMEDI, limiteMinutes: cas.limiteMinutes };
  const resultat = construireResultats([spectacle], [salle], criteres).visibles[0];
  if (resultat === undefined) {
    throw new Error('Aucun résultat pour ce cas.');
  }
  return { resultat, criteres };
}
