import type { ReactNode } from 'react';

import { Sheet } from '../composants/ui/Sheet';

interface Props {
  readonly ouverte: boolean;
  readonly onFermer: () => void;
  /** Texte du bouton d'application, par exemple « Voir 6 séances ». */
  readonly libelleVoir: string;
  readonly onVoir: () => void;
  readonly children: ReactNode;
}

/** Feuille « Votre sortie » : la feuille commune, avec les champs des critères et le bouton « Voir N séances ». */
export function FeuilleCriteres({ ouverte, onFermer, libelleVoir, onVoir, children }: Props) {
  return (
    <Sheet
      open={ouverte}
      onClose={onFermer}
      title="Votre sortie"
      footer={
        <button
          type="button"
          onClick={onVoir}
          className="min-h-[54px] w-full rounded-full bg-corail text-base font-extrabold text-fond hover:bg-corail-vif"
        >
          {libelleVoir}
        </button>
      }
    >
      {children}
    </Sheet>
  );
}
