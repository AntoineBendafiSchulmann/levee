import type { CiblePagePiece } from '../domaine/seance';

export type Ecran = 'accueil' | 'resultats' | 'piece';

/** D'où l'on vient quand on ouvre la page d'une pièce : détermine le libellé et la cible du bouton de retour. */
export type ProvenancePiece = 'accueil' | 'resultats';

export interface Route {
  readonly ecran: Ecran;
  /** Présente seulement pour l'écran `piece`. */
  readonly cible: CiblePagePiece | null;
}

const ACCUEIL: Route = { ecran: 'accueil', cible: null };

function decoder(segment: string): string | null {
  try {
    const texte = decodeURIComponent(segment);
    return texte === '' ? null : texte;
  } catch {
    return null;
  }
}

/**
 * Adresses connues : `/` (accueil), `/seances` (résultats), `/piece/:idSpectacle` et `/seances/:idSeance`
 * (fiche). Une adresse inconnue affiche l'accueil, comme avant ; l'identifiant d'une fiche n'est vérifié
 * qu'au moment de la résoudre (fiche introuvable).
 */
export function analyserChemin(chemin: string): Route {
  const segments = chemin.split('/').filter((s) => s !== '');
  const [premier, identifiant, ...reste] = segments;
  if (reste.length > 0) {
    return ACCUEIL;
  }
  if (premier === 'seances' && identifiant === undefined) {
    return { ecran: 'resultats', cible: null };
  }
  if ((premier === 'piece' || premier === 'seances') && identifiant !== undefined) {
    const id = decoder(identifiant);
    return id === null ? ACCUEIL : { ecran: 'piece', cible: { type: premier === 'piece' ? 'piece' : 'seance', id } };
  }
  return ACCUEIL;
}

export function cheminCible(cible: CiblePagePiece): string {
  return `${cible.type === 'piece' ? '/piece' : '/seances'}/${encodeURIComponent(cible.id)}`;
}

export function cheminEcran(ecran: Exclude<Ecran, 'piece'>): string {
  return ecran === 'accueil' ? '/' : '/seances';
}

/** Provenance par défaut d'une page de pièce ouverte directement : une séance vient des résultats, une pièce de l'accueil. */
export function provenanceParDefaut(route: Route): ProvenancePiece {
  return route.cible?.type === 'seance' ? 'resultats' : 'accueil';
}

/** Identifiant (et ancre d'adresse) des séances du soir sous l'accueil : `/#seances-du-soir`. */
export const ID_SEANCES_DU_SOIR = 'seances-du-soir';

/**
 * Ancre demandée par l'adresse à l'ouverture : `/#seances-du-soir` (lien de l'en-tête ouvert dans un nouvel
 * onglet, ou page rechargée) mène aux séances du soir. Sans cette lecture, le navigateur ne défilerait pas : la
 * section des séances du soir est dans le conteneur de défilement de la page, rendu après le chargement.
 */
export function ancreDepuisUrl(chemin: string, hash: string): 'seances-du-soir' | null {
  return analyserChemin(chemin).ecran === 'accueil' && hash === `#${ID_SEANCES_DU_SOIR}` ? 'seances-du-soir' : null;
}
