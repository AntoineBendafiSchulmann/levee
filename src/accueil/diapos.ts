import { prochaineSeance } from '../domaine/programme';
import { formaterHeure, libelleJourCourt } from '../domaine/temps';
import type { AfficheDef, JourIso, Salle, Spectacle } from '../domaine/types';

/** Une affiche du carrousel, prête à être affichée. */
export interface DiapoAffiche {
  readonly id: string;
  readonly titre: string;
  readonly auteur: string;
  readonly salle: string;
  /** Prochaine séance à partir du jour affiché, par exemple « Ce soir · 20h00 ». */
  readonly legende: string;
  readonly affiche: AfficheDef;
}

/** Une diapositive par spectacle qui a encore une séance à partir du jour affiché. */
export function construireDiapos(
  spectacles: readonly Spectacle[],
  salles: readonly Salle[],
  jour: JourIso,
  aujourdhui: JourIso,
): DiapoAffiche[] {
  return spectacles.flatMap((spectacle) => {
    const seance = prochaineSeance(spectacle, jour);
    if (seance === undefined) {
      return [];
    }
    const salle = salles.find((s) => s.id === spectacle.salleId);
    if (salle === undefined) {
      throw new Error(`Salle inconnue « ${spectacle.salleId} » pour le spectacle « ${spectacle.id} ».`);
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
