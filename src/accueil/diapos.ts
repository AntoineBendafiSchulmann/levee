import type { GroupeSeance, StatutSeance } from '../domaine/evaluation';
import { libelleGenre } from '../domaine/genres';
import { joursDisponibles } from '../domaine/programme';
import { resultatDeSeance } from '../domaine/resultats';
import { choisirSeance, identifiantSeance, trouverSalle } from '../domaine/seance';
import {
  dureesDistinctes,
  formaterDuree,
  formaterHeure,
  formaterPlageHeures,
  libelleJourCourt,
  libelleJourDu,
  libelleJourLong,
} from '../domaine/temps';
import type { AfficheDef, CriteresSortie, JourIso, Salle, Spectacle } from '../domaine/types';

/** Une séance de la pièce affichée, proposée sous l'affiche : elle ouvre la représentation exacte. */
export interface SeanceDeLaPiece {
  /** Identifiant exact de la séance (`/seances/:id`). */
  readonly id: string;
  /** Clé de retour du focus : distincte de celle des cartes de la sélection, qui portent l'identifiant seul. */
  readonly cle: string;
  readonly heure: string;
  /** Plage de fin calculée, ou `null` quand la durée est inconnue. */
  readonly sortie: string | null;
  readonly statut: StatutSeance;
  readonly groupe: GroupeSeance;
  /** Vrai pour la séance que la fiche présélectionne. */
  readonly choisie: boolean;
}

/** Une affiche du carrousel, prête à être affichée, avec le texte de la pièce quand elle est à l'affiche. */
export interface DiapoAffiche {
  readonly id: string;
  readonly titre: string;
  readonly auteur: string;
  readonly salle: string;
  /** Séance présélectionnée à l'ouverture de la fiche, par exemple « Ce soir · 20h00 ». */
  readonly legende: string;
  readonly affiche: AfficheDef;
  /** « Molière · Comédie, Classique ». */
  readonly auteurGenres: string;
  /** « Théâtre Saint-Ambroise · Paris 11e ». */
  readonly salleQuartier: string;
  /** « 12 rue Saint-Ambroise · 1 h 50 ». */
  readonly adresseDuree: string;
  readonly synopsis: string;
  /** Titre de la liste des séances : « Ce soir », ou « Pas de séance de samedi · Vendredi 27 novembre ». */
  readonly enteteSeances: string;
  /** Les séances de la pièce ce jour-là, ou le premier jour où elle est jouée. */
  readonly seances: readonly SeanceDeLaPiece[];
}

function libelleDuree(spectacle: Spectacle): string {
  const minutes = dureesDistinctes(spectacle.durees);
  if (minutes.length === 0) {
    return 'durée non annoncée';
  }
  return minutes.map(formaterDuree).join(' ou ');
}

/**
 * Une diapositive par spectacle qui a encore une séance à partir du jour choisi. La légende annonce la
 * séance que la fiche présélectionne (`choisirSeance`) : affiche et fiche donnent toujours le même horaire.
 */
export function construireDiapos(
  spectacles: readonly Spectacle[],
  salles: readonly Salle[],
  criteres: CriteresSortie,
  aujourdhui: JourIso,
): DiapoAffiche[] {
  return spectacles.flatMap((spectacle) => {
    if (!spectacle.seances.some((s) => s.jour >= criteres.jour)) {
      return [];
    }
    const salle = trouverSalle(salles, spectacle);
    const choisie = choisirSeance(spectacle, salle, criteres);
    if (choisie === undefined) {
      return [];
    }
    const jours = joursDisponibles([spectacle]);
    const jourSeances = jours.includes(criteres.jour) ? criteres.jour : (jours.find((j) => j >= criteres.jour) ?? jours[0] ?? criteres.jour);
    const seances = spectacle.seances
      .filter((s) => s.jour === jourSeances)
      .sort((a, b) => a.debutMinutes - b.debutMinutes)
      .map((seance): SeanceDeLaPiece => {
        const { id, evaluation } = resultatDeSeance(spectacle, salle, seance, criteres);
        return {
          id,
          cle: `seance-${id}`,
          heure: formaterHeure(seance.debutMinutes),
          sortie: evaluation.fin === null ? null : formaterPlageHeures(evaluation.fin),
          statut: evaluation.statut,
          groupe: evaluation.groupe,
          choisie: id === identifiantSeance(spectacle, choisie),
        };
      });
    return [
      {
        id: spectacle.id,
        titre: spectacle.titre,
        auteur: spectacle.auteur,
        salle: salle.nom,
        legende: `${libelleJourCourt(choisie.jour, aujourdhui)} · ${formaterHeure(choisie.debutMinutes)}`,
        affiche: spectacle.affiche,
        auteurGenres: `${spectacle.auteur} · ${spectacle.genres.map(libelleGenre).join(', ')}`,
        salleQuartier: `${salle.nom} · ${salle.quartier}`,
        adresseDuree: `${salle.adresse} · ${libelleDuree(spectacle)}`,
        synopsis: spectacle.synopsis,
        enteteSeances:
          jourSeances === criteres.jour
            ? libelleJourCourt(jourSeances, aujourdhui)
            : `Pas de séance ${libelleJourDu(criteres.jour, aujourdhui)} · ${libelleJourLong(jourSeances)}`,
        seances,
      },
    ];
  });
}
