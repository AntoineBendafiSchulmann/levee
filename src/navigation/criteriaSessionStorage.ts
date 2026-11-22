import {
  DEPARTURE_MAX_MINUTES,
  DEPARTURE_MIN_MINUTES,
  EXIT_LIMIT_MAX_MINUTES,
  EXIT_LIMIT_MIN_MINUTES,
  TIME_STEP_MINUTES,
} from '../domain/timeBounds';
import { GENRES } from '../domain/genres';
import type { OutingCriteria, IsoDay, DeparturePoint } from '../domain/types';

/** Key in `sessionStorage`: the outing criteria, for the lifetime of the tab only. Persisted contract: it never changes. */
export const CRITERIA_STORAGE_KEY = 'levee:criteres';

/** What the domain accepts: the scheduled days and the known departure points. */
export interface CriteriaConstraints {
  readonly days: readonly IsoDay[];
  readonly departurePoints: readonly DeparturePoint[];
}

/** The part of `Storage` used here; another object of the same shape serves the tests. */
export interface SessionStore {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

/*
 * Persisted shape: `{ jour, origine, departMinutes, limiteMinutes, genres, auteur, masquerImpossibles }`, written in this
 * order. It does not change with the names used in the code, so that criteria saved before a rename are read back
 * identically: `toStoredCriteria` and `parseCriteria` are the only place that knows the persisted names.
 */
export function toStoredCriteria(criteria: OutingCriteria) {
  return {
    jour: criteria.day,
    origine: criteria.departurePointId,
    departMinutes: criteria.departureMinutes,
    limiteMinutes: criteria.exitLimitMinutes,
    genres: criteria.genres,
    auteur: criteria.author,
    masquerImpossibles: criteria.hideImpossible,
  };
}

const isValidMinutes = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= min &&
  value <= max &&
  (value - min) % TIME_STEP_MINUTES === 0;

/**
 * Readable JSON is not necessarily an acceptable set of criteria: unscheduled day, unknown departure point, time
 * out of bounds or off the 5-minute step, unknown genre, wrong type. Takes the persisted shape and returns the
 * criteria as they would be entered in the interface, or `null` if a single value is refused (never a partial fix).
 */
export function parseCriteria(value: unknown, constraints: CriteriaConstraints): OutingCriteria | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { jour, origine, departMinutes, limiteMinutes, genres, auteur, masquerImpossibles } = value as Record<string, unknown>;
  const knownGenres: readonly unknown[] = GENRES.map((g) => g.id);
  if (
    typeof jour !== 'string' ||
    !constraints.days.includes(jour) ||
    typeof origine !== 'string' ||
    !constraints.departurePoints.some((point) => point.id === origine) ||
    !isValidMinutes(departMinutes, DEPARTURE_MIN_MINUTES, DEPARTURE_MAX_MINUTES) ||
    !isValidMinutes(limiteMinutes, EXIT_LIMIT_MIN_MINUTES, EXIT_LIMIT_MAX_MINUTES) ||
    !Array.isArray(genres) ||
    !genres.every((g) => knownGenres.includes(g)) ||
    new Set<unknown>(genres).size !== genres.length ||
    typeof auteur !== 'string' ||
    typeof masquerImpossibles !== 'boolean'
  ) {
    return null;
  }
  return {
    day: jour,
    departurePointId: origine,
    departureMinutes: departMinutes,
    exitLimitMinutes: limiteMinutes,
    genres: GENRES.map((g) => g.id).filter((id) => genres.includes(id)),
    author: auteur,
    hideImpossible: masquerImpossibles,
  };
}

/** The browser's `sessionStorage`, or `undefined` when it is inaccessible (access denied, strict private mode). */
export function tabStorage(): SessionStore | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

/** Criteria remembered in the tab; `undefined` if nothing, unreadable, refused by the domain, or storage inaccessible. */
export function readCriteria(storage: SessionStore | undefined, constraints: CriteriaConstraints): OutingCriteria | undefined {
  try {
    const raw = storage?.getItem(CRITERIA_STORAGE_KEY) ?? null;
    return raw === null ? undefined : (parseCriteria(JSON.parse(raw), constraints) ?? undefined);
  } catch {
    return undefined;
  }
}

/** Remembers the criteria; no effect when storage is inaccessible or full. */
export function writeCriteria(storage: SessionStore | undefined, criteria: OutingCriteria): void {
  try {
    storage?.setItem(CRITERIA_STORAGE_KEY, JSON.stringify(toStoredCriteria(criteria)));
  } catch {
    // The criteria stay in memory for this page session: only a reload forgets them.
  }
}
