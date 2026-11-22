import { useId, useState } from 'react';

import { SEUIL_ARRIVEE_SERREE_MINUTES } from '../domaine/evaluation';
import type { ResultatSeance } from '../domaine/resultats';
import { formaterDistance, formaterDuree, formaterHeure, formaterPlageHeures } from '../domaine/temps';
import type { CriteresSortie } from '../domaine/types';

interface Props {
  readonly resultat: ResultatSeance;
  readonly criteres: CriteresSortie;
  readonly origineLibelle: string;
}

type Nature = 'Votre saisie' | 'Estimation' | 'Calculé' | 'Annoncé';

interface Ligne {
  readonly libelle: string;
  readonly valeur: string;
  readonly nature?: Nature;
  readonly note?: string;
  readonly classe?: string;
  readonly fort?: boolean;
  /** Marge : ligne en italique et en pointillé, déduite des lignes voisines. */
  readonly marge?: boolean;
}

const COULEUR = { ok: 'text-ok', attention: 'text-attention', danger: 'text-danger' } as const;

const NATURE: Readonly<Record<Nature, string>> = {
  'Votre saisie': 'border-solid border-texte',
  Estimation: 'border-dashed border-texte',
  Calculé: 'border-solid border-texte bg-texte text-fond',
  Annoncé: 'border-solid border-texte',
};

function lignes({ evaluation, spectacle, seance }: ResultatSeance, criteres: CriteresSortie, origineLibelle: string, description: string | undefined): Ligne[] {
  const { statut, trajetMinutes, arriveeMinutes, margeArriveeMinutes: marge, fin } = evaluation;
  const resultat: Ligne[] = [
    { libelle: `Départ · ${origineLibelle}`, valeur: formaterHeure(criteres.departMinutes), nature: 'Votre saisie' },
    trajetMinutes === null
      ? { libelle: 'Trajet estimé', valeur: 'Non estimé', note: `Aucune estimation depuis ${origineLibelle}`, classe: COULEUR.attention }
      : {
          libelle: 'Trajet estimé',
          valeur: `${String(trajetMinutes)} min`,
          nature: 'Estimation',
          ...(description === undefined ? {} : { note: description }),
        },
    arriveeMinutes === null
      ? { libelle: 'Arrivée estimée', valeur: '?', note: 'Impossible sans trajet estimé', fort: true }
      : { libelle: 'Arrivée estimée', valeur: formaterHeure(arriveeMinutes), nature: 'Calculé', note: 'Départ + trajet estimé', fort: true },
    { libelle: 'Début de la représentation', valeur: formaterHeure(seance.debutMinutes), nature: 'Annoncé', note: 'Horaire publié par le théâtre' },
    {
      libelle: 'Marge à l’arrivée',
      valeur: marge === null ? '—' : marge >= 0 ? `${String(marge)} min` : `${String(-marge)} min de retard`,
      marge: true,
      classe: marge === null ? '' : marge < 0 ? COULEUR.danger : marge < SEUIL_ARRIVEE_SERREE_MINUTES ? COULEUR.attention : COULEUR.ok,
    },
  ];

  if (spectacle.durees.length === 0) {
    resultat.push({
      libelle: 'Durée annoncée',
      valeur: 'Non communiquée',
      note: 'Ni le théâtre ni la billetterie ne l’indiquent',
      classe: COULEUR.attention,
    });
  } else {
    for (const duree of spectacle.durees) {
      resultat.push({ libelle: 'Durée annoncée', valeur: formaterDuree(duree.minutes), nature: 'Annoncé', note: `Source : ${duree.source}` });
    }
  }

  resultat.push(
    fin === null
      ? { libelle: 'Fin calculée', valeur: '?', note: 'Impossible sans durée', fort: true, classe: COULEUR.attention }
      : {
          libelle: 'Fin calculée',
          valeur: formaterPlageHeures(fin),
          nature: 'Calculé',
          note: fin.min === fin.max ? 'Début + durée annoncée' : 'Début + durée la plus courte / la plus longue',
          fort: true,
          classe: statut === 'fin-incertaine' ? COULEUR.attention : statut === 'fin-depassee' ? COULEUR.danger : '',
        },
    { libelle: 'Limite de sortie', valeur: formaterHeure(criteres.limiteMinutes), nature: 'Votre saisie' },
  );

  let margeSortie: { valeur: string; classe: string };
  if (fin === null) {
    margeSortie = { valeur: `durée max. ${formaterDuree(Math.max(0, criteres.limiteMinutes - seance.debutMinutes))}`, classe: COULEUR.attention };
  } else if (fin.max <= criteres.limiteMinutes) {
    margeSortie = { valeur: `${String(criteres.limiteMinutes - fin.max)} min`, classe: COULEUR.ok };
  } else if (fin.min > criteres.limiteMinutes) {
    margeSortie = { valeur: `${String(fin.min - criteres.limiteMinutes)} min de dépassement`, classe: COULEUR.danger };
  } else {
    margeSortie = { valeur: `+${String(criteres.limiteMinutes - fin.min)} à −${String(fin.max - criteres.limiteMinutes)} min`, classe: COULEUR.attention };
  }
  resultat.push({ libelle: 'Marge à la sortie', valeur: margeSortie.valeur, classe: margeSortie.classe, marge: true });
  return resultat;
}

/**
 * « Trajet et calcul horaire » : le détail du calcul de la séance choisie, ligne par ligne, avec la nature
 * de chaque valeur (saisie, estimation, calcul ou annonce du théâtre). Replié par défaut.
 */
export function CalculHoraire({ resultat, criteres, origineLibelle }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const idPanneau = useId();
  const trajet = resultat.salle.trajets[criteres.origine];
  const detail = lignes(resultat, criteres, origineLibelle, trajet?.description);
  const distance = trajet?.distanceKm === undefined ? '' : `Distance : ${formaterDistance(trajet.distanceKm)}. `;
  const moyen = trajet?.description === undefined ? '' : ` (${trajet.description.charAt(0).toLowerCase()}${trajet.description.slice(1)})`;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        aria-expanded={ouvert}
        aria-controls={idPanneau}
        onClick={() => {
          setOuvert((precedent) => !precedent);
        }}
        className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-filet px-4 text-[15px] font-semibold hover:bg-surface-survol"
      >
        <span>Trajet et calcul horaire</span>
        <span aria-hidden="true" className="text-xl leading-none">
          {ouvert ? '−' : '+'}
        </span>
      </button>
      <div id={idPanneau} hidden={!ouvert}>
        <ul className="flex flex-col">
          {detail.map((ligne, i) => (
            <li
              key={`${ligne.libelle}-${String(i)}`}
              className={`grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-filet py-2.5 ${ligne.marge === true ? 'border-dashed' : ''}`}
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className={`text-sm ${ligne.fort === true ? 'font-bold' : 'font-medium'} ${ligne.marge === true ? 'italic' : ''}`}>{ligne.libelle}</span>
                {ligne.note === undefined ? null : <span className="text-xs text-texte-doux">{ligne.note}</span>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[17px] font-bold whitespace-nowrap ${ligne.classe ?? ''}`}>{ligne.valeur}</span>
                {ligne.nature === undefined ? null : (
                  <span className={`rounded-[2px] border px-1.5 py-0.5 text-[10px] font-bold tracking-[0.1em] uppercase ${NATURE[ligne.nature]}`}>
                    {ligne.nature}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] leading-[1.45] text-pretty text-texte-doux">
          {distance}
          {distance === '' ? '' : 'La distance seule ne dit pas si vous arriverez à temps ; le calcul s’appuie sur le trajet estimé'}
          {distance === '' ? '' : `${moyen}. `}
          Une arrivée à moins de {SEUIL_ARRIVEE_SERREE_MINUTES} min du début est signalée comme serrée.
        </p>
      </div>
    </div>
  );
}
