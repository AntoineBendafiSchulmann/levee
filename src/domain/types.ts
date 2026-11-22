/** Date in ISO format `YYYY-MM-DD`. */
export type IsoDay = string;

export type GenreId = 'comedie' | 'classique' | 'drame' | 'contemporain';

/** Id of a departure point (a station), key of a venue's travel estimates. */
export type DeparturePointId = string;

export interface DeparturePoint {
  readonly id: DeparturePointId;
  readonly label: string;
}

/** Criteria of an outing. Each change applies to the results immediately. */
export interface OutingCriteria {
  readonly day: IsoDay;
  readonly departurePointId: DeparturePointId;
  /** Departure time, in minutes since midnight. */
  readonly departureMinutes: number;
  /** Latest time to leave the theatre, in minutes since midnight: an end exactly at the limit is fine. */
  readonly exitLimitMinutes: number;
  /** No genre chosen: all genres. */
  readonly genres: readonly GenreId[];
  /** Free text, case- and accent-insensitive; empty: all authors. */
  readonly author: string;
  readonly hideImpossible: boolean;
}

/** Estimated travel (not computed from a distance) from a departure point to a venue. */
export interface TravelEstimate {
  readonly minutes: number;
  /** How to get there, e.g. « Métro 9 puis 6 min à pied ». Absent: the play page does not mention it. */
  readonly description?: string;
  /** As-the-crow-flies distance, in kilometres. Informative: the evaluation only uses `minutes`. */
  readonly distanceKm?: number;
}

export interface Venue {
  readonly id: string;
  readonly name: string;
  readonly district: string;
  /** Street address, without the city. */
  readonly address: string;
  /** One travel estimate per known departure point; a departure point missing here has no estimate. */
  readonly travelEstimates: Readonly<Record<DeparturePointId, TravelEstimate>>;
}

export interface Performance {
  readonly day: IsoDay;
  /** Announced start time, in minutes since midnight. */
  readonly startMinutes: number;
}

/** Announced duration, with the source announcing it. Several sources may contradict each other. */
export interface AnnouncedDuration {
  readonly minutes: number;
  readonly source: string;
}

/** Geometric shape of a poster. Positions and width in % of the poster. */
export interface PosterShape {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  /** Width / height ratio. */
  readonly ratio: number;
  readonly kind: 'round' | 'rectangle';
  readonly color: string;
  /** Rotation in degrees. */
  readonly rotation?: number;
  /** Solid outline; thickness in poster-width units (cqw). */
  readonly outline?: { readonly thickness: number; readonly color: string };
}

/** Graphic composition of a poster: two shapes and a title, no image. */
export interface PosterDesign {
  readonly background: string;
  readonly ink: string;
  readonly shapeA: PosterShape;
  readonly shapeB: PosterShape;
  readonly title: {
    readonly family: 'editorial' | 'grotesque';
    /** Title font size, in poster-width units (cqw). */
    readonly size: number;
    readonly italic: boolean;
    readonly atTop: boolean;
  };
}

/** The two fares offered for every play: full price (`full`) and « moins de 26 ans » (`reduced`). */
export type FareId = 'full' | 'reduced';

/** Price of a seat in whole euros, for each fare. */
export type Fares = Readonly<Record<FareId, number>>;

export interface Play {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  /** One- or two-sentence summary, shown on the play page. */
  readonly synopsis: string;
  readonly genres: readonly GenreId[];
  readonly venueId: string;
  /** No announced duration: empty array. */
  readonly announcedDurations: readonly AnnouncedDuration[];
  /** Seat prices, specific to the play. */
  readonly fares: Fares;
  readonly performances: readonly Performance[];
  readonly poster: PosterDesign;
}
