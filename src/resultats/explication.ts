import type { ResultatSeance } from '../domaine/resultats';
import { formaterDuree, formaterHeure, libelleMinutes } from '../domaine/temps';
import type { CriteresSortie } from '../domaine/types';

/** Durées annoncées distinctes, de la plus courte à la plus longue. */
export function dureesDistinctes(resultat: ResultatSeance): number[] {
  return [...new Set(resultat.spectacle.durees.map((d) => d.minutes))].sort((a, b) => a - b);
}

/** « a », « a et b », « a, b et c ». */
function enumerer(elements: readonly string[]): string {
  if (elements.length <= 1) {
    return elements.join('');
  }
  return `${elements.slice(0, -1).join(', ')} et ${elements.at(-1) ?? ''}`;
}

/** Fin incertaine : les durées annoncées, la plage de fin qui en résulte et la limite qui tombe dedans. */
function phraseFinIncertaine(resultat: ResultatSeance, limite: string): string | null {
  const { fin } = resultat.evaluation;
  if (fin === null) {
    return null;
  }
  const durees = dureesDistinctes(resultat);
  const annonce = durees.length === 2 ? 'Deux durées sont annoncées' : `${String(durees.length)} durées sont annoncées`;
  return `${annonce} : ${enumerer(durees.map(formaterDuree))}. La séance peut finir entre ${formaterHeure(fin.min)} et ${formaterHeure(fin.max)}. Votre limite est ${limite}.`;
}

const PHRASE_DUREE_INCONNUE = 'Durée non annoncée : la fin ne peut pas être calculée.';

/**
 * Phrase d'explication sous les horaires d'une carte ; `null` quand la séance est simplement « à temps ».
 * Quand le trajet manque, la phrase dit aussi si la durée est inconnue ou si la plage de fin chevauche
 * la limite : le statut « Trajet non estimé » ne doit pas cacher ces incertitudes.
 */
export function explicationSeance(resultat: ResultatSeance, criteres: CriteresSortie, origineLibelle: string): string | null {
  const { statut, margeArriveeMinutes: marge, arriveeMinutes: arrivee, fin } = resultat.evaluation;
  const limite = formaterHeure(criteres.limiteMinutes);
  switch (statut) {
    case 'a-temps':
      return null;
    case 'arrivee-serree':
      return marge === 0
        ? 'Arrivée estimée à l’heure du début : aucune marge si le trajet s’allonge.'
        : `Arrivée estimée ${libelleMinutes(marge ?? 0)} avant le début : marge courte si le trajet s’allonge.`;
    case 'fin-incertaine':
      return phraseFinIncertaine(resultat, limite);
    case 'duree-inconnue':
      return `${PHRASE_DUREE_INCONNUE} Il faudrait ${formaterDuree(
        Math.max(0, criteres.limiteMinutes - resultat.seance.debutMinutes),
      )} au plus pour sortir au plus tard à ${limite}.`;
    case 'trajet-inconnu': {
      const base = `Aucun trajet n’est estimé depuis ${origineLibelle} : l’heure d’arrivée ne peut pas être calculée.`;
      if (fin === null) {
        return `${base} ${PHRASE_DUREE_INCONNUE}`;
      }
      const chevauche = fin.min <= criteres.limiteMinutes && fin.max > criteres.limiteMinutes;
      const incertitude = chevauche ? phraseFinIncertaine(resultat, limite) : null;
      return incertitude === null ? base : `${base} ${incertitude}`;
    }
    case 'arrivee-tardive':
      return `Arrivée estimée à ${formaterHeure(arrivee ?? 0)}, soit ${libelleMinutes(-(marge ?? 0))} après le début.`;
    case 'fin-depassee':
      return fin === null
        ? null
        : `Fin calculée à ${formaterHeure(fin.min)}, soit ${libelleMinutes(fin.min - criteres.limiteMinutes)} après votre limite.`;
  }
}
