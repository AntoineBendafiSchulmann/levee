import { choisirSeance, trouverSalle } from '../domaine/seance';
import { formaterHeure, libelleJourCourt } from '../domaine/temps';
import type { AfficheDef, CriteresSortie, JourIso, Salle, Spectacle } from '../domaine/types';

/** Une affiche du carrousel, prête à être affichée. */
export interface DiapoAffiche {
  readonly id: string;
  readonly titre: string;
  readonly auteur: string;
  readonly salle: string;
  /** Séance présélectionnée à l'ouverture de la fiche, par exemple « Ce soir · 20h00 ». */
  readonly legende: string;
  readonly affiche: AfficheDef;
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
    const seance = choisirSeance(spectacle, salle, criteres);
    if (seance === undefined) {
      return [];
    }
    return [
      {
        id: spectacle.id,
        titre: spectacle.titre,
        auteur: spectacle.auteur,
        salle: salle.nom,
        legende: `${libelleJourCourt(seance.jour, aujourdhui)} · ${formaterHeure(seance.debutMinutes)}`,
        affiche: spectacle.affiche,
      },
    ];
  });
}
