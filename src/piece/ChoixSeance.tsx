import type { Evaluation } from '../domaine/evaluation';
import { formaterHeure, formaterPlageHeures, libelleJourCourt } from '../domaine/temps';
import type { JourIso, Seance } from '../domaine/types';
import { LIBELLE_STATUT, POINT_GROUPE, TEXTE_GROUPE } from '../composants/presentationStatut';

export interface LigneSeance {
  readonly identifiant: string;
  readonly seance: Seance;
  readonly evaluation: Evaluation;
}

interface Props {
  readonly jours: readonly JourIso[];
  readonly jourAffiche: JourIso;
  readonly aujourdhui: JourIso;
  readonly lignes: readonly LigneSeance[];
  readonly identifiantChoisi: string;
  readonly onJour: (jour: JourIso) => void;
  readonly onSeance: (identifiant: string) => void;
}

function ligneArrivee({ arriveeMinutes, margeArriveeMinutes: marge }: Evaluation): string {
  if (arriveeMinutes === null || marge === null) {
    return 'Arrivée non estimable · trajet non estimé';
  }
  const ecart = marge >= 0 ? `${String(marge)} min avant` : `${String(-marge)} min après le début`;
  return `Arrivée estimée ${formaterHeure(arriveeMinutes)} · ${ecart}`;
}

function ligneSortie({ fin }: Evaluation): string {
  if (fin === null) {
    return 'Sortie non calculable · durée inconnue';
  }
  return `Sortie calculée ${formaterPlageHeures(fin)}`;
}

/** Onglets de jour puis séances de ce jour. Un onglet filtre la liste ; seul un clic sur un horaire change la séance choisie. */
export function ChoixSeance({ jours, jourAffiche, aujourdhui, lignes, identifiantChoisi, onJour, onSeance }: Props) {
  return (
    <>
      <div role="group" aria-label="Jour" className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
        {jours.map((jour) => (
          <button
            key={jour}
            type="button"
            aria-pressed={jour === jourAffiche}
            onClick={() => {
              onJour(jour);
            }}
            className="min-h-11 flex-none rounded-full border border-filet px-4 text-sm font-bold aria-pressed:border-texte aria-pressed:bg-texte aria-pressed:text-fond"
          >
            {libelleJourCourt(jour, aujourdhui)}
          </button>
        ))}
      </div>
      <ul aria-label="Séances de ce jour" className="flex flex-col gap-2">
        {lignes.map(({ identifiant, seance, evaluation }) => {
          const choisie = identifiant === identifiantChoisi;
          return (
            <li key={identifiant}>
              <button
                type="button"
                aria-pressed={choisie}
                onClick={() => {
                  onSeance(identifiant);
                }}
                className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 rounded-md border-2 p-3.5 text-left ${choisie ? 'border-texte bg-surface-2' : 'border-filet hover:bg-surface-survol'}`}
              >
                <span className="text-[32px] leading-none font-extrabold tracking-[-0.03em]">{formaterHeure(seance.debutMinutes)}</span>
                <span className="flex min-w-0 flex-col gap-[3px]">
                  <span className={`inline-flex items-center gap-[7px] text-xs font-bold tracking-[0.08em] uppercase ${TEXTE_GROUPE[evaluation.groupe]}`}>
                    <span aria-hidden="true" className={`size-2 flex-none rounded-full ${POINT_GROUPE[evaluation.groupe]}`} />
                    {LIBELLE_STATUT[evaluation.statut]}
                  </span>
                  <span className="text-sm leading-[1.35]">{ligneArrivee(evaluation)}</span>
                  <span className="text-sm leading-[1.35]">{ligneSortie(evaluation)}</span>
                </span>
                <span aria-hidden="true" className={`flex size-[22px] items-center justify-center rounded-full border-2 ${choisie ? 'border-texte' : 'border-contour'}`}>
                  <span className={`size-2.5 rounded-full ${choisie ? 'bg-texte' : 'bg-transparent'}`} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
