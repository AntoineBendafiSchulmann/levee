import type { ReactNode } from 'react';

import { Sheet } from '../components/ui/Sheet';

interface Props {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  /** Label of the apply button, for example « Voir 6 séances ». */
  readonly viewLabel: string;
  readonly onView: () => void;
  readonly children: ReactNode;
}

/** « Votre sortie » sheet: the shared sheet, with the criteria fields and the « Voir N séances » button. */
export function CriteriaSheet({ isOpen, onClose, viewLabel, onView, children }: Props) {
  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      title="Votre sortie"
      footer={
        <button
          type="button"
          onClick={onView}
          className="min-h-[54px] w-full rounded-full bg-corail text-base font-extrabold text-fond hover:bg-corail-vif"
        >
          {viewLabel}
        </button>
      }
    >
      {children}
    </Sheet>
  );
}
