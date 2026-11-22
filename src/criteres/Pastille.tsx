import type { ReactNode } from 'react';

interface Props {
  readonly actif: boolean;
  readonly onClick: () => void;
  readonly children: ReactNode;
  /** `carree` : jour du calendrier ; `pointillee` : raccourci qui remplit un champ. */
  readonly variante?: 'pilule' | 'carree' | 'pointillee';
}

const FORME = {
  pilule: 'min-h-11 rounded-full',
  carree: 'min-h-12 rounded-md px-1.5! whitespace-nowrap',
  pointillee: 'min-h-11 rounded-full border-dashed',
} as const;

/** Bouton à bascule des critères (jour, départ, genre, raccourci d'auteur). */
export function Pastille({ actif, onClick, children, variante = 'pilule' }: Props) {
  return (
    <button
      type="button"
      aria-pressed={variante === 'pointillee' ? undefined : actif}
      onClick={onClick}
      className={`${FORME[variante]} border px-3.5 text-sm font-semibold ${
        actif ? 'border-texte bg-texte text-fond' : 'border-contour hover:bg-surface-survol'
      }`}
    >
      {children}
    </button>
  );
}
