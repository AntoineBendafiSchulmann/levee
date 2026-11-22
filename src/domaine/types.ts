/** Date au format ISO `AAAA-MM-JJ`. */
export type JourIso = string;

export type GenreId = 'comedie' | 'classique' | 'drame' | 'contemporain';

/** Identifiant d'un point de départ (une station), clé des trajets d'une salle. */
export type OrigineId = string;

export interface Origine {
  readonly id: OrigineId;
  readonly libelle: string;
}

/** Critères d'une sortie. Chaque modification s'applique tout de suite aux résultats. */
export interface CriteresSortie {
  readonly jour: JourIso;
  readonly origine: OrigineId;
  /** Heure de départ, en minutes depuis minuit. */
  readonly departMinutes: number;
  /** Heure limite de sortie du théâtre, en minutes depuis minuit : une fin exactement à la limite convient. */
  readonly limiteMinutes: number;
  /** Aucun genre choisi : tous les genres. */
  readonly genres: readonly GenreId[];
  /** Texte libre, sans distinction de casse ni d'accents ; vide : tous les auteurs. */
  readonly auteur: string;
  readonly masquerImpossibles: boolean;
}

/** Trajet estimé (et non calculé à partir d'une distance) d'un point de départ vers une salle. */
export interface Trajet {
  readonly minutes: number;
  /** Façon de s'y rendre, par exemple « Métro 9 puis 6 min à pied ». Absente : la fiche ne la mentionne pas. */
  readonly description?: string;
  /** Distance à vol d'oiseau, en kilomètres. Informative : l'évaluation n'utilise que `minutes`. */
  readonly distanceKm?: number;
}

export interface Salle {
  readonly id: string;
  readonly nom: string;
  readonly quartier: string;
  /** Adresse postale, sans la ville. */
  readonly adresse: string;
  /** Un trajet par point de départ connu ; un point de départ absent ici n'a pas d'estimation. */
  readonly trajets: Readonly<Record<OrigineId, Trajet>>;
}

export interface Seance {
  readonly jour: JourIso;
  /** Heure de début annoncée, en minutes depuis minuit. */
  readonly debutMinutes: number;
}

/** Durée annoncée, avec la source qui l'annonce. Plusieurs sources peuvent se contredire. */
export interface Duree {
  readonly minutes: number;
  readonly source: string;
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

/** Les deux tarifs proposés pour toutes les pièces : plein tarif (`full`) et « moins de 26 ans » (`reduced`). */
export type FareId = 'full' | 'reduced';

/** Prix d'une place en euros entiers, pour chaque tarif. */
export type Fares = Readonly<Record<FareId, number>>;

export interface Spectacle {
  readonly id: string;
  readonly titre: string;
  readonly auteur: string;
  /** Résumé en une ou deux phrases, affiché sur la fiche. */
  readonly synopsis: string;
  readonly genres: readonly GenreId[];
  readonly salleId: string;
  /** Aucune durée annoncée : tableau vide. */
  readonly durees: readonly Duree[];
  /** Prix d'une place, propre à la pièce. */
  readonly fares: Fares;
  readonly seances: readonly Seance[];
  readonly affiche: AfficheDef;
}
