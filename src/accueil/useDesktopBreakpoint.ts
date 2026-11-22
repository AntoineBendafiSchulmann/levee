import { useSyncExternalStore } from 'react';

const REQUETE_BUREAU = '(min-width: 1100px)';

function abonner(notifier: () => void): () => void {
  const requete = window.matchMedia(REQUETE_BUREAU);
  requete.addEventListener('change', notifier);
  return () => {
    requete.removeEventListener('change', notifier);
  };
}

/**
 * Vrai à partir du seuil « bureau » (1100 px, le même que les classes `bureau:`) : la scène à indice, avec ses
 * voisines de part et d'autre. En dessous, le défilement natif avec accroche. Suit un redimensionnement.
 */
export function useDesktopBreakpoint(): boolean {
  return useSyncExternalStore(
    abonner,
    () => window.matchMedia(REQUETE_BUREAU).matches,
    () => false,
  );
}
