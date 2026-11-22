import { useCallback, useEffect, useRef, useState } from 'react';

import type { CiblePagePiece } from '../domaine/seance';
import type { CriteresSortie } from '../domaine/types';
import { ecrireCriteres, lireCriteres, stockageOnglet, type ContraintesCriteres } from './stockageCriteres';
import { analyserChemin, ancreDepuisUrl, cheminCible, cheminEcran, provenanceParDefaut, type Ecran, type ProvenancePiece, type Route } from './chemins';

export type { Ecran, ProvenancePiece } from './chemins';
/** Défilement vertical mémorisé, par page. */
export type CleDefilement = 'accueil' | 'resultats';

/**
 * Ce que l'application range dans `history.state` quand elle ouvre une fiche : l'origine, et la clé de
 * l'élément qui doit retrouver le focus au retour. Un état absent ou d'une autre forme (ouverture directe,
 * rechargement d'une adresse sans état) donne l'origine par défaut et aucun focus à restituer.
 */
interface EtatHistorique {
  readonly levee: true;
  readonly origine: ProvenancePiece;
  readonly cleOrigine: string | null;
}

function lireEtatHistorique(): EtatHistorique | null {
  const etat: unknown = window.history.state;
  if (typeof etat !== 'object' || etat === null) {
    return null;
  }
  const { levee, origine, cleOrigine } = etat as Record<string, unknown>;
  if (levee !== true || (origine !== 'accueil' && origine !== 'resultats')) {
    return null;
  }
  return { levee, origine, cleOrigine: typeof cleOrigine === 'string' ? cleOrigine : null };
}

interface Navigation {
  readonly chemin: string;
  /** Provenance de la page de pièce affichée (`null` hors page de pièce). */
  readonly origine: { readonly origine: ProvenancePiece; readonly cle: string | null } | null;
  /** Clé de l'élément qui retrouve le focus après un retour depuis la fiche. */
  readonly cleRetour: string | null;
}

function navigationDepuisLocation(precedente: Navigation | null): Navigation {
  const chemin = window.location.pathname;
  const route = analyserChemin(chemin);
  const etat = lireEtatHistorique();
  const origine =
    route.ecran === 'piece'
      ? { origine: etat?.origine ?? provenanceParDefaut(route), cle: etat?.cleOrigine ?? null }
      : null;
  const avant = precedente?.origine ?? null;
  const cleRetour = route.ecran !== 'piece' && avant?.origine === route.ecran ? avant.cle : null;
  return { chemin, origine, cleRetour };
}

/**
 * État de navigation du parcours accueil → critères → résultats → fiche : écran affiché, critères en
 * mémoire (appliqués en direct), feuille de critères ouverte, positions de défilement à restituer au retour.
 * L'écran se reflète dans l'adresse (`/`, `/seances`, `/piece/:id`, `/seances/:id`) pour que le retour du
 * navigateur, l'ouverture directe et le rechargement fonctionnent. Les critères ne sont pas dans l'adresse :
 * ils sont gardés dans le `sessionStorage` de l'onglet (l'actualisation les conserve), et une ouverture
 * directe dans un onglet neuf utilise les critères initiaux. La séance affichée, elle, vient toujours de l'adresse.
 */
export function useParcours(criteresInitiaux: CriteresSortie, contraintes: ContraintesCriteres) {
  // Les critères de l'onglet survivent à l'actualisation (sessionStorage) ; un onglet neuf, un stockage absent,
  // illisible ou refusé par le domaine donne les critères initiaux.
  const [criteres, setCriteres] = useState(() => lireCriteres(stockageOnglet(), contraintes) ?? criteresInitiaux);

  useEffect(() => {
    ecrireCriteres(stockageOnglet(), criteres);
  }, [criteres]);

  const [navigation, setNavigation] = useState<Navigation>(() => navigationDepuisLocation(null));
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);
  /** Vrai après la première navigation de l'utilisateur : la page d'arrivée y place alors le focus. */
  const [naviguee, setNaviguee] = useState(false);
  const ancre = useRef<'seances-du-soir' | null>(ancreDepuisUrl(window.location.pathname, window.location.hash));
  /** Pièce à l'affiche sur l'accueil, retenue par son identifiant : elle suit la pièce, pas sa position dans la liste. */
  const pieceActive = useRef<string | null>(null);
  const positions = useRef<Record<CleDefilement, number>>({ accueil: 0, resultats: 0 });

  const route: Route = analyserChemin(navigation.chemin);

  const synchroniser = useCallback(() => {
    setNavigation((precedente) => navigationDepuisLocation(precedente));
    setFeuilleOuverte(false);
    setNaviguee(true);
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', synchroniser);
    return () => {
      window.removeEventListener('popstate', synchroniser);
    };
  }, [synchroniser]);

  const aller = useCallback(
    (cible: Exclude<Ecran, 'piece'>) => {
      if (window.location.pathname !== cheminEcran(cible)) {
        window.history.pushState(null, '', cheminEcran(cible));
      }
      synchroniser();
    },
    [synchroniser],
  );

  /** Ouvre une fiche ; `cleFocus` désigne l'élément (carte, affiche) qui retrouvera le focus au retour. */
  const ouvrirPiece = useCallback(
    (cible: CiblePagePiece, origine: ProvenancePiece, cleFocus: string) => {
      const etat: EtatHistorique = { levee: true, origine, cleOrigine: cleFocus };
      window.history.pushState(etat, '', cheminCible(cible));
      synchroniser();
    },
    [synchroniser],
  );

  /**
   * Choix explicite d'un horaire sur la fiche : l'adresse devient celle de cette séance, sans nouvelle
   * entrée d'historique, pour qu'un rechargement affiche la même séance et que « retour » quitte la fiche.
   */
  const choisirSeance = useCallback((identifiant: string) => {
    const chemin = cheminCible({ type: 'seance', id: identifiant });
    if (window.location.pathname === chemin) {
      return;
    }
    const etat: unknown = window.history.state;
    window.history.replaceState(etat, '', chemin);
    setNavigation((precedente) => ({ ...precedente, chemin }));
  }, []);

  /**
   * Retour depuis la fiche. Arrivé par l'application, on revient à l'entrée précédente de l'historique
   * (même effet que le retour du navigateur : critères, défilement et focus restitués). Arrivé directement,
   * il n'y a rien avant : on va à l'écran d'origine.
   */
  const retournerDePiece = useCallback(() => {
    if (lireEtatHistorique() !== null) {
      window.history.back();
    } else {
      aller(provenanceParDefaut(analyserChemin(window.location.pathname)));
    }
  }, [aller]);

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
    // Depuis une autre page : l'accueil s'ouvre en haut (le retour arrière, lui, restitue la position).
    positions.current.accueil = 0;
    aller('accueil');
  }, [aller]);
  /** « Séances de la soirée » depuis une autre page : l'accueil s'ouvre sur les séances du soir. */
  const allerSeancesDuSoir = useCallback(() => {
    ancre.current = 'seances-du-soir';
    aller('accueil');
  }, [aller]);
  /** Lit une seule fois l'ancre demandée par la navigation, puis l'oublie. */
  const consommerAncre = useCallback((): 'seances-du-soir' | null => {
    const demandee = ancre.current;
    ancre.current = null;
    return demandee;
  }, []);

  const lirePieceActive = useCallback(() => pieceActive.current, []);
  const memoriserPieceActive = useCallback((id: string) => {
    pieceActive.current = id;
  }, []);

  const lirePosition = useCallback((cle: CleDefilement) => positions.current[cle], []);
  const memoriserPosition = useCallback((cle: CleDefilement, valeur: number) => {
    positions.current[cle] = valeur;
  }, []);

  return {
    ecran: route.ecran,
    cible: route.cible,
    provenancePiece: navigation.origine?.origine ?? null,
    cleRetour: navigation.cleRetour,
    criteres,
    feuilleOuverte,
    naviguee,
    modifierCriteres,
    ouvrirFeuille,
    fermerFeuille,
    voirSeances,
    retournerAccueil,
    allerSeancesDuSoir,
    consommerAncre,
    ouvrirPiece,
    choisirSeance,
    retournerDePiece,
    lirePosition,
    memoriserPosition,
    lirePieceActive,
    memoriserPieceActive,
  };
}

export type Parcours = ReturnType<typeof useParcours>;
