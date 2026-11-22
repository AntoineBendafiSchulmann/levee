import type { JourIso, Seance, Spectacle } from './types';

/** Première séance du spectacle ce jour-là ou après, ou `undefined` s'il n'en reste aucune. */
export function prochaineSeance(spectacle: Spectacle, jour: JourIso): Seance | undefined {
  return spectacle.seances
    .filter((s) => s.jour >= jour)
    .sort((a, b) => a.jour.localeCompare(b.jour) || a.debutMinutes - b.debutMinutes)[0];
}

/** Jours où au moins une séance est programmée, dans l'ordre chronologique. */
export function joursDisponibles(spectacles: readonly Spectacle[]): JourIso[] {
  return [...new Set(spectacles.flatMap((spectacle) => spectacle.seances.map((s) => s.jour)))].sort();
}
