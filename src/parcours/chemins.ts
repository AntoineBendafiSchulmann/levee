import type { CibleFiche } from '../domaine/seance';

export type Ecran = 'accueil' | 'resultats' | 'fiche';

/** D'où l'on vient quand on ouvre une fiche : détermine le libellé et la cible du bouton de retour. */
export type OrigineFiche = 'accueil' | 'resultats';

export interface Route {
  readonly ecran: Ecran;
  /** Présente seulement pour l'écran `fiche`. */
  readonly cible: CibleFiche | null;
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
    return id === null ? ACCUEIL : { ecran: 'fiche', cible: { type: premier === 'piece' ? 'piece' : 'seance', id } };
  }
  return ACCUEIL;
}

export function cheminCible(cible: CibleFiche): string {
  return `${cible.type === 'piece' ? '/piece' : '/seances'}/${encodeURIComponent(cible.id)}`;
}

export function cheminEcran(ecran: Exclude<Ecran, 'fiche'>): string {
  return ecran === 'accueil' ? '/' : '/seances';
}

/** Origine par défaut d'une fiche ouverte directement : une séance vient des résultats, une pièce de l'accueil. */
export function origineParDefaut(route: Route): OrigineFiche {
  return route.cible?.type === 'seance' ? 'resultats' : 'accueil';
}

/** Identifiant (et ancre d'adresse) de la sélection de séances sous l'accueil : `/#seances-du-soir`. */
export const ID_SELECTION = 'seances-du-soir';

/**
 * Ancre demandée par l'adresse à l'ouverture : `/#seances-du-soir` (lien de l'en-tête ouvert dans un nouvel
 * onglet, ou page rechargée) mène à la sélection. Sans cette lecture, le navigateur ne défilerait pas : la
 * sélection est dans le conteneur de défilement de la page, rendu après le chargement.
 */
export function ancreDepuisAdresse(chemin: string, hash: string): 'selection' | null {
  return analyserChemin(chemin).ecran === 'accueil' && hash === `#${ID_SELECTION}` ? 'selection' : null;
}
