import { useSyncExternalStore } from 'react';

const REQUETE_MOUVEMENT_REDUIT = '(prefers-reduced-motion: reduce)';

function abonner(notifier: () => void): () => void {
  const requete = window.matchMedia(REQUETE_MOUVEMENT_REDUIT);
  requete.addEventListener('change', notifier);
  return () => {
    requete.removeEventListener('change', notifier);
  };
}

/** Vrai quand l'utilisateur demande moins de mouvement ; suit un changement en cours de session. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    abonner,
    () => window.matchMedia(REQUETE_MOUVEMENT_REDUIT).matches,
    () => false,
  );
}
