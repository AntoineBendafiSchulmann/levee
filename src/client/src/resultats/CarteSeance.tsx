import { Affiche } from '../accueil/Affiche';
import type { GroupeSeance, StatutSeance } from '../domaine/evaluation';
import { libelleGenre } from '../domaine/genres';
import type { ResultatSeance } from '../domaine/resultats';
import { formaterDuree, formaterHeure, libelleMinutes } from '../domaine/temps';
import type { CriteresSortie } from '../domaine/types';
import { dureesDistinctes, explicationSeance } from './explication';
import { FriseHoraire } from './FriseHoraire';

interface Props {
  readonly resultat: ResultatSeance;
  readonly criteres: CriteresSortie;
  readonly origineLibelle: string;
}

const LIBELLE_STATUT: Readonly<Record<StatutSeance, string>> = {
  'a-temps': 'À temps',
  'arrivee-serree': 'Arrivée serrée',
  'fin-incertaine': 'Fin incertaine',
  'duree-inconnue': 'Durée inconnue',
  'trajet-inconnu': 'Trajet non estimé',
  'arrivee-tardive': 'Commence avant votre arrivée',
  'fin-depassee': 'Finit après votre limite',
};

const TEXTE: Readonly<Record<GroupeSeance, string>> = {
  possible: 'text-ok',
  'a-verifier': 'text-attention',
  impossible: 'text-danger',
};
const POINT: Readonly<Record<GroupeSeance, string>> = {
  possible: 'bg-ok',
  'a-verifier': 'bg-attention',
  impossible: 'bg-danger',
};

/** Sous-titre de la colonne « Sortie » : la fin est calculée, jamais annoncée. */
function sousSortie(fin: { min: number; max: number } | null, limite: number): string {
  if (fin === null) {
    return 'non calculable';
  }
  if (fin.min === fin.max) {
    const ecart = limite - fin.min;
    if (ecart === 0) {
      return 'calculée · pile à votre limite';
    }
    return ecart > 0 ? `calculée · ${libelleMinutes(ecart)} avant la limite` : `calculée · ${libelleMinutes(-ecart)} après la limite`;
  }
  if (fin.max <= limite) {
    return fin.max === limite
      ? 'calculée · au plus tard pile à votre limite'
      : `calculée · au plus tard ${libelleMinutes(limite - fin.max)} avant la limite`;
  }
  return fin.min > limite ? `calculée · ${libelleMinutes(fin.min - limite)} après la limite` : 'calculée · deux durées annoncées';
}

function Colonne({ titre, valeur, lignes, classe }: { titre: string; valeur: string; lignes: readonly string[]; classe: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-[11px] font-semibold tracking-[0.1em] text-texte-doux uppercase">{titre}</dt>
      <dd className={`text-xl leading-[1.1] font-extrabold tracking-[-0.02em] ${classe}`}>{valeur}</dd>
      {lignes.map((ligne) => (
        <dd key={ligne} className={`text-xs leading-[1.3] ${classe === '' ? 'text-texte-doux' : classe}`}>
          {ligne}
        </dd>
      ))}
    </div>
  );
}

/**
 * Une carte = une séance. Trois colonnes distinguent ce qui est estimé (l'arrivée, d'après le trajet),
 * annoncé (le début et la durée) et calculé (la sortie).
 */
export function CarteSeance({ resultat, criteres, origineLibelle }: Props) {
  const { evaluation, spectacle, salle, seance } = resultat;
  const { statut, groupe, arriveeMinutes, margeArriveeMinutes: marge, trajetMinutes, fin } = evaluation;
  const durees = dureesDistinctes(resultat);
  const explication = explicationSeance(resultat, criteres, origineLibelle);

  const classeArrivee = marge !== null && marge < 0 ? 'text-danger' : statut === 'arrivee-serree' ? 'text-attention' : '';
  const classeDebut = durees.length === 1 ? '' : 'text-attention';
  const classeSortie =
    statut === 'fin-depassee' ? 'text-danger' : statut === 'fin-incertaine' || statut === 'duree-inconnue' ? 'text-attention' : '';

  const ligneDuree =
    durees.length === 0
      ? 'annoncé · durée non annoncée'
      : durees.length === 1
        ? `annoncé · durée ${formaterDuree(durees[0] ?? 0)}`
        : `annoncé · durées ${durees.map(formaterDuree).join(' ou ')}`;

  return (
    <article className="flex flex-col gap-3.5 rounded-md border border-filet bg-surface p-3.5">
      <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-3.5">
        <div>
          <Affiche affiche={spectacle.affiche} titre={spectacle.titre} auteur={spectacle.auteur} salle={salle.nom} />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <p className={`inline-flex items-center gap-[7px] text-xs font-bold tracking-[0.08em] uppercase ${TEXTE[groupe]}`}>
            <span aria-hidden="true" className={`size-2 flex-none rounded-full ${POINT[groupe]}`} />
            {LIBELLE_STATUT[statut]}
          </p>
          <h2 className="font-editorial text-[26px] leading-none font-normal text-pretty italic">{spectacle.titre}</h2>
          <p className="text-xs font-semibold tracking-[0.1em] text-texte-doux uppercase">
            {spectacle.auteur} · {spectacle.genres.map(libelleGenre).join(', ')}
          </p>
          <p className="text-sm">
            {salle.nom} · {salle.quartier}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)] gap-2.5 border-t border-filet pt-3">
        <Colonne
          titre="Arrivée"
          valeur={arriveeMinutes === null ? '?' : formaterHeure(arriveeMinutes)}
          lignes={[
            trajetMinutes === null ? 'trajet non estimé' : `estimée · trajet ${libelleMinutes(trajetMinutes)}`,
            ...(marge === null ? [] : [marge >= 0 ? `${libelleMinutes(marge)} avant le début` : `${libelleMinutes(-marge)} après le début`]),
          ]}
          classe={classeArrivee}
        />
        <Colonne titre="Début" valeur={formaterHeure(seance.debutMinutes)} lignes={[ligneDuree]} classe={classeDebut} />
        <Colonne
          titre="Sortie"
          valeur={
            fin === null ? '?' : fin.min === fin.max ? formaterHeure(fin.min) : `${formaterHeure(fin.min)}–${formaterHeure(fin.max)}`
          }
          lignes={[sousSortie(fin, criteres.limiteMinutes)]}
          classe={classeSortie}
        />
      </dl>

      {explication === null ? null : (
        <p className={`text-sm leading-snug text-pretty ${TEXTE[groupe]}`}>{explication}</p>
      )}

      <FriseHoraire
        departMinutes={criteres.departMinutes}
        arriveeMinutes={arriveeMinutes}
        debutMinutes={seance.debutMinutes}
        fin={fin}
        limiteMinutes={criteres.limiteMinutes}
        groupe={groupe}
      />
    </article>
  );
}
