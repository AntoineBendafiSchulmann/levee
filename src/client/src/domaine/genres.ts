import type { GenreId } from './types';

export const GENRES: readonly { readonly id: GenreId; readonly libelle: string }[] = [
  { id: 'comedie', libelle: 'Comédie' },
  { id: 'classique', libelle: 'Classique' },
  { id: 'drame', libelle: 'Drame' },
  { id: 'contemporain', libelle: 'Contemporain' },
];

export function libelleGenre(id: GenreId): string {
  return GENRES.find((genre) => genre.id === id)?.libelle ?? id;
}
