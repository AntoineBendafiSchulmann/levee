import { useCallback, useEffect, useRef, useState } from 'react';

import type { CriteresSortie } from '../domaine/types';

export type Ecran = 'accueil' | 'resultats';
export type CleDefilement = 'affiches' | 'resultats';

const CHEMINS: Readonly<Record<Ecran, string>> = { accueil: '/', resultats: '/seances' };

function ecranDepuisChemin(chemin: string): Ecran {
  return chemin.replace(/\/+$/, '') === CHEMINS.resultats ? 'resultats' : 'accueil';
}

/**
 * État de navigation du parcours accueil → critères → résultats : écran affiché, critères en mémoire
 * (appliqués en direct), feuille de critères ouverte, positions de défilement à restituer au retour.
 * L'écran se reflète dans l'adresse (`/` ou `/seances`) pour que le retour du navigateur fonctionne ;
 * les critères, eux, ne sont pas dans l'adresse : une ouverture directe de `/seances` utilise les
 * critères initiaux.
 */
export function useParcours(criteresInitiaux: CriteresSortie) {
  const [criteres, setCriteres] = useState(criteresInitiaux);
  const [ecran, setEcran] = useState<Ecran>(() => ecranDepuisChemin(window.location.pathname));
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);
  /** Vrai après la première navigation de l'utilisateur : la page d'arrivée y place alors le focus. */
  const [naviguee, setNaviguee] = useState(false);
  const positions = useRef<Record<CleDefilement, number>>({ affiches: 0, resultats: 0 });

  useEffect(() => {
    const surRetour = () => {
      setEcran(ecranDepuisChemin(window.location.pathname));
      setFeuilleOuverte(false);
      setNaviguee(true);
    };
    window.addEventListener('popstate', surRetour);
    return () => {
      window.removeEventListener('popstate', surRetour);
    };
  }, []);

  const aller = useCallback((cible: Ecran) => {
    if (ecranDepuisChemin(window.location.pathname) !== cible) {
      window.history.pushState(null, '', CHEMINS[cible]);
    }
    setEcran(cible);
    setFeuilleOuverte(false);
    setNaviguee(true);
  }, []);

  const modifierCriteres = useCallback((changement: Partial<CriteresSortie>) => {
    setCriteres((precedents) => ({ ...precedents, ...changement }));
  }, []);

  const ouvrirFeuille = useCallback(() => {
    setFeuilleOuverte(true);
  }, []);
  const fermerFeuille = useCallback(() => {
    setFeuilleOuverte(false);
  }, []);
  const voirSeances = useCallback(() => {
    aller('resultats');
  }, [aller]);
  const retournerAccueil = useCallback(() => {
    aller('accueil');
  }, [aller]);

  const lirePosition = useCallback((cle: CleDefilement) => positions.current[cle], []);
  const memoriserPosition = useCallback((cle: CleDefilement, valeur: number) => {
    positions.current[cle] = valeur;
  }, []);

  return {
    ecran,
    criteres,
    feuilleOuverte,
    naviguee,
    modifierCriteres,
    ouvrirFeuille,
    fermerFeuille,
    voirSeances,
    retournerAccueil,
    lirePosition,
    memoriserPosition,
  };
}

export type Parcours = ReturnType<typeof useParcours>;
