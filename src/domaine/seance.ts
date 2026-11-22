import { evaluerSeance, type Evaluation } from './evaluation';
import { prochaineSeance } from './programme';
import type { CriteresSortie, Salle, Seance, Spectacle } from './types';

/** Identifiant stable et unique d'une séance : `spectacle-jour-début`. C'est celui des adresses `/seances/:id`. */
export function identifiantSeance(spectacle: Spectacle, seance: Seance): string {
  return `${spectacle.id}-${seance.jour}-${String(seance.debutMinutes)}`;
}

/** Évalue une séance d'après les critères de la sortie (départ, origine, limite) ; le jour des critères n'y joue aucun rôle. */
export function evaluerPourCriteres(spectacle: Spectacle, salle: Salle, seance: Seance, criteres: CriteresSortie): Evaluation {
  return evaluerSeance({
    debutMinutes: seance.debutMinutes,
    durees: spectacle.durees,
    trajet: salle.trajets[criteres.origine],
    departMinutes: criteres.departMinutes,
    limiteMinutes: criteres.limiteMinutes,
  });
}

export function trouverSalle(salles: readonly Salle[], spectacle: Spectacle): Salle {
  const salle = salles.find((s) => s.id === spectacle.salleId);
  if (salle === undefined) {
    throw new Error(`Salle inconnue « ${spectacle.salleId} » pour le spectacle « ${spectacle.id} ».`);
  }
  return salle;
}

export interface SeanceTrouvee {
  readonly spectacle: Spectacle;
  readonly seance: Seance;
}

/** Retrouve une séance par son identifiant exact ; `undefined` si aucune ne correspond. */
export function trouverSeance(spectacles: readonly Spectacle[], identifiant: string): SeanceTrouvee | undefined {
  for (const spectacle of spectacles) {
    const seance = spectacle.seances.find((s) => identifiantSeance(spectacle, s) === identifiant);
    if (seance !== undefined) {
      return { spectacle, seance };
    }
  }
  return undefined;
}

/**
 * Séance présélectionnée quand on ouvre une pièce sans avoir choisi d'horaire (affiche de l'accueil).
 * Même règle que la maquette : parmi les séances du jour choisi qui commencent à partir du départ,
 * la première qui convient (groupe « possible »), sinon la première ; à défaut, la première séance du
 * jour ; à défaut, la prochaine séance après ce jour, puis la toute première. `undefined` seulement
 * si la pièce n'a aucune séance.
 */
export function choisirSeance(spectacle: Spectacle, salle: Salle, criteres: CriteresSortie): Seance | undefined {
  const parHeure = (a: Seance, b: Seance) => a.jour.localeCompare(b.jour) || a.debutMinutes - b.debutMinutes;
  const duJour = spectacle.seances.filter((s) => s.jour === criteres.jour).sort(parHeure);
  const aPartirDuDepart = duJour.filter((s) => s.debutMinutes >= criteres.departMinutes);
  const convenable = aPartirDuDepart.find((s) => evaluerPourCriteres(spectacle, salle, s, criteres).groupe === 'possible');
  return (
    convenable ??
    aPartirDuDepart[0] ??
    duJour[0] ??
    prochaineSeance(spectacle, criteres.jour) ??
    [...spectacle.seances].sort(parHeure)[0]
  );
}

export interface PagePieceResolue {
  readonly spectacle: Spectacle;
  readonly salle: Salle;
  readonly seance: Seance;
}

/** Une adresse de fiche : soit une pièce (séance à présélectionner), soit une séance précise. */
export type CiblePagePiece = { readonly type: 'piece' | 'seance'; readonly id: string };

/** Résout l'adresse d'une fiche ; `undefined` si la pièce ou la séance n'existe pas. */
export function resoudrePagePiece(
  spectacles: readonly Spectacle[],
  salles: readonly Salle[],
  cible: CiblePagePiece,
  criteres: CriteresSortie,
): PagePieceResolue | undefined {
  if (cible.type === 'seance') {
    const trouvee = trouverSeance(spectacles, cible.id);
    return trouvee === undefined ? undefined : { ...trouvee, salle: trouverSalle(salles, trouvee.spectacle) };
  }
  const spectacle = spectacles.find((s) => s.id === cible.id);
  if (spectacle === undefined) {
    return undefined;
  }
  const salle = trouverSalle(salles, spectacle);
  const seance = choisirSeance(spectacle, salle, criteres);
  return seance === undefined ? undefined : { spectacle, salle, seance };
}
