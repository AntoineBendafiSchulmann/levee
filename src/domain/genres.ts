import type { GenreId } from './types';

export const GENRES: readonly { readonly id: GenreId; readonly label: string }[] = [
  { id: 'comedie', label: 'Comédie' },
  { id: 'classique', label: 'Classique' },
  { id: 'drame', label: 'Drame' },
  { id: 'contemporain', label: 'Contemporain' },
];

export function genreLabel(id: GenreId): string {
  return GENRES.find((genre) => genre.id === id)?.label ?? id;
}
