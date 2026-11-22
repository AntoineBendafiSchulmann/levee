import type { JourIso, Seance, Spectacle } from './types';

/** Première séance du spectacle ce jour-là ou après, ou `undefined` s'il n'en reste aucune. */
export function prochaineSeance(spectacle: Spectacle, jour: JourIso): Seance | undefined {
  return spectacle.seances
    .filter((s) => s.jour >= jour)
    .sort((a, b) => a.jour.localeCompare(b.jour) || a.debutMinutes - b.debutMinutes)[0];
}

/** Nombre de séances programmées ce jour-là, tous spectacles confondus. */
export function compterSeances(spectacles: readonly Spectacle[], jour: JourIso): number {
  return spectacles.reduce((total, sp) => total + sp.seances.filter((s) => s.jour === jour).length, 0);
}
