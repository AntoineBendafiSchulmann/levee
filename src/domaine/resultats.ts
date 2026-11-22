import type { Evaluation } from './evaluation';
import { evaluerPourCriteres, identifiantSeance, trouverSalle } from './seance';
import { normaliser, pluriel } from './texte';
import type { CriteresSortie, Salle, Seance, Spectacle } from './types';

/** Un résultat est une séance : une pièce jouée deux fois le même jour donne deux résultats. */
export interface ResultatSeance {
  /** Stable et unique par séance : `spectacle-jour-début`. */
  readonly id: string;
  readonly spectacle: Spectacle;
  readonly salle: Salle;
  readonly seance: Seance;
  readonly evaluation: Evaluation;
}

export interface Compteurs {
  readonly possibles: number;
  readonly aVerifier: number;
  readonly impossibles: number;
}

export interface SeanceAvantDepart {
  readonly id: string;
  readonly titre: string;
  readonly debutMinutes: number;
}

export interface Resultats {
  /** Séances affichées, par heure de début. Les impossibles en sont absentes si on les masque. */
  readonly visibles: readonly ResultatSeance[];
  /** Totaux de toutes les séances listées, masquées ou non. */
  readonly compteurs: Compteurs;
  /** Vrai quand des séances impossibles existent et sont masquées. */
  readonly impossiblesMasquees: boolean;
  /** Séances du jour qui commencent avant l'heure de départ : ni évaluées ni listées. */
  readonly avantDepart: readonly SeanceAvantDepart[];
}

/** Le résultat d'une séance précise : la même évaluation que sur une carte de résultats, pour la fiche. */
export function resultatDeSeance(spectacle: Spectacle, salle: Salle, seance: Seance, criteres: CriteresSortie): ResultatSeance {
  return {
    id: identifiantSeance(spectacle, seance),
    spectacle,
    salle,
    seance,
    evaluation: evaluerPourCriteres(spectacle, salle, seance, criteres),
  };
}

function correspond(spectacle: Spectacle, criteres: CriteresSortie): boolean {
  const genreOk =
    criteres.genres.length === 0 || spectacle.genres.some((genre) => criteres.genres.includes(genre));
  const recherche = normaliser(criteres.auteur);
  return genreOk && (recherche === '' || normaliser(spectacle.auteur).includes(recherche));
}

export function construireResultats(
  spectacles: readonly Spectacle[],
  salles: readonly Salle[],
  criteres: CriteresSortie,
): Resultats {
  const listees: ResultatSeance[] = [];
  const avantDepart: SeanceAvantDepart[] = [];

  for (const spectacle of spectacles.filter((s) => correspond(s, criteres))) {
    const salle = trouverSalle(salles, spectacle);
    for (const seance of spectacle.seances.filter((s) => s.jour === criteres.jour)) {
      const id = identifiantSeance(spectacle, seance);
      if (seance.debutMinutes < criteres.departMinutes) {
        avantDepart.push({ id, titre: spectacle.titre, debutMinutes: seance.debutMinutes });
        continue;
      }
      listees.push(resultatDeSeance(spectacle, salle, seance, criteres));
    }
  }

  const parHeure = (a: { debutMinutes: number; titre: string }, b: { debutMinutes: number; titre: string }) =>
    a.debutMinutes - b.debutMinutes || a.titre.localeCompare(b.titre, 'fr');
  listees.sort((a, b) =>
    parHeure(
      { debutMinutes: a.seance.debutMinutes, titre: a.spectacle.titre },
      { debutMinutes: b.seance.debutMinutes, titre: b.spectacle.titre },
    ),
  );
  avantDepart.sort(parHeure);

  const compter = (groupe: Evaluation['groupe']) => listees.filter((r) => r.evaluation.groupe === groupe).length;
  const compteurs: Compteurs = {
    possibles: compter('possible'),
    aVerifier: compter('a-verifier'),
    impossibles: compter('impossible'),
  };
  const impossiblesMasquees = criteres.masquerImpossibles && compteurs.impossibles > 0;

  return {
    visibles: criteres.masquerImpossibles ? listees.filter((r) => r.evaluation.groupe !== 'impossible') : listees,
    compteurs,
    impossiblesMasquees,
    avantDepart,
  };
}

/**
 * « 3 possibles · 1 à vérifier · 2 impossibles (masquées) ». Les totaux couvrent toutes les séances
 * listées ; quand les impossibles sont masquées, la mention le dit à côté de leur nombre.
 */
export function libelleCompteurs(compteurs: Compteurs, impossiblesMasquees: boolean): string {
  if (compteurs.possibles + compteurs.aVerifier + compteurs.impossibles === 0) {
    return 'Aucune séance';
  }
  const morceaux = [pluriel(compteurs.possibles, 'possible', 'possibles')];
  if (compteurs.aVerifier > 0) {
    morceaux.push(`${String(compteurs.aVerifier)} à vérifier`);
  }
  if (compteurs.impossibles > 0) {
    const masquees = impossiblesMasquees ? (compteurs.impossibles > 1 ? ' (masquées)' : ' (masquée)') : '';
    morceaux.push(`${pluriel(compteurs.impossibles, 'impossible', 'impossibles')}${masquees}`);
  }
  return morceaux.join(' · ');
}

/** Libellé du bouton « Voir N séances » : N est le nombre de cartes effectivement visibles. */
export function libelleBoutonVoir(nombreVisibles: number): string {
  return `Voir ${pluriel(nombreVisibles, 'séance', 'séances')}`;
}
