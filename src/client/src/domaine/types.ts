/** Date au format ISO `AAAA-MM-JJ`. */
export type JourIso = string;

/** Critères d'une sortie. Lecture seule dans l'accueil du lot 1. */
export interface CriteresSortie {
  readonly jour: JourIso;
  readonly origine: string;
  /** Heure limite de sortie du théâtre, en minutes depuis minuit. */
  readonly limiteMinutes: number;
}

export interface Salle {
  readonly id: string;
  readonly nom: string;
}

export interface Seance {
  readonly jour: JourIso;
  /** Heure de début, en minutes depuis minuit. */
  readonly debutMinutes: number;
}

/** Forme géométrique d'une affiche. Positions et largeur en % de l'affiche. */
export interface FormeAffiche {
  readonly gauche: number;
  readonly haut: number;
  readonly largeur: number;
  /** Rapport largeur / hauteur. */
  readonly ratio: number;
  readonly forme: 'rond' | 'rectangle';
  readonly couleur: string;
  /** Rotation en degrés. */
  readonly rotation?: number;
  /** Contour plein ; épaisseur en unités de largeur d'affiche (cqw). */
  readonly contour?: { readonly epaisseur: number; readonly couleur: string };
}

/** Composition graphique d'une affiche : deux formes et un titre, sans image. */
export interface AfficheDef {
  readonly fond: string;
  readonly encre: string;
  readonly formeA: FormeAffiche;
  readonly formeB: FormeAffiche;
  readonly titre: {
    readonly famille: 'editorial' | 'grotesque';
    /** Corps du titre, en unités de largeur d'affiche (cqw). */
    readonly taille: number;
    readonly italique: boolean;
    readonly enHaut: boolean;
  };
}

export interface Spectacle {
  readonly id: string;
  readonly titre: string;
  readonly auteur: string;
  readonly salleId: string;
  readonly seances: readonly Seance[];
  readonly affiche: AfficheDef;
}
