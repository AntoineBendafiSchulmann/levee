import type { ReactNode } from 'react';

interface Props {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly children: ReactNode;
  /** `square`: calendar day; `dashed`: shortcut that fills a field. */
  readonly variant?: 'pill' | 'square' | 'dashed';
}

const SHAPE_CLASSES = {
  pill: 'min-h-11 rounded-full',
  square: 'min-h-12 rounded-md px-1.5! whitespace-nowrap',
  dashed: 'min-h-11 rounded-full border-dashed',
} as const;

/** Toggle button for the criteria (day, departure, genre, author shortcut). */
export function Chip({ active, onClick, children, variant = 'pill' }: Props) {
  return (
    <button
      type="button"
      aria-pressed={variant === 'dashed' ? undefined : active}
      onClick={onClick}
      className={`${SHAPE_CLASSES[variant]} border px-3.5 text-sm font-semibold ${
        active ? 'border-texte bg-texte text-fond' : 'border-contour hover:bg-surface-survol'
      }`}
    >
      {children}
    </button>
  );
}
