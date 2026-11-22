import { useId } from 'react';

import {
  DEPART_MAX_MINUTES,
  DEPART_MIN_MINUTES,
  LIMITE_MAX_MINUTES,
  LIMITE_MIN_MINUTES,
  PAS_HEURE_MINUTES,
} from '../domaine/criteres';
import { GENRES } from '../domaine/genres';
import { libelleJourCourt } from '../domaine/temps';
import { normaliser } from '../domaine/texte';
import type { CriteresSortie, GenreId, JourIso, Origine } from '../domaine/types';
import { Pastille } from './Pastille';
import { ReglageHeure } from './ReglageHeure';

/** Ce que le formulaire propose : dépend des données disponibles. */
export interface OptionsCriteres {
  readonly aujourdhui: JourIso;
  readonly jours: readonly JourIso[];
  readonly origines: readonly Origine[];
  readonly auteursSuggeres: readonly string[];
}

interface Props {
  readonly criteres: CriteresSortie;
  readonly options: OptionsCriteres;
  /** Chaque changement s'applique tout de suite aux résultats. */
  readonly onChange: (changement: Partial<CriteresSortie>) => void;
}

const TITRE = 'text-xs font-semibold tracking-[0.12em] text-texte-doux uppercase';

export function FormulaireCriteres({ criteres, options, onChange }: Props) {
  const idAuteur = useId();
  const recherche = normaliser(criteres.auteur);

  const basculerGenre = (id: GenreId) => {
    const choisis = criteres.genres.includes(id)
      ? criteres.genres.filter((genre) => genre !== id)
      : GENRES.map((genre) => genre.id).filter((genre) => genre === id || criteres.genres.includes(genre));
    onChange({ genres: choisis });
  };

  return (
    <div className="flex flex-col gap-[22px]">
      <fieldset className="flex flex-col gap-2.5">
        <legend className={`${TITRE} mb-2.5`}>Jour</legend>
        <div className="grid grid-cols-4 gap-1.5">
          {options.jours.map((jour) => (
            <Pastille
              key={jour}
              variante="carree"
              actif={criteres.jour === jour}
              onClick={() => {
                onChange({ jour });
              }}
            >
              {libelleJourCourt(jour, options.aujourdhui)}
            </Pastille>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2.5">
        <legend className={`${TITRE} mb-2.5`}>Point de départ</legend>
        <div className="flex flex-wrap gap-2">
          {options.origines.map((origine) => (
            <Pastille
              key={origine.id}
              actif={criteres.origine === origine.id}
              onClick={() => {
                onChange({ origine: origine.id });
              }}
            >
              {origine.libelle}
            </Pastille>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-x-4 gap-y-[18px]">
        <ReglageHeure
          variante="bloc"
          libelle="Heure de départ"
          minutes={criteres.departMinutes}
          min={DEPART_MIN_MINUTES}
          max={DEPART_MAX_MINUTES}
          pas={PAS_HEURE_MINUTES}
          libelleMoins="Départ 5 minutes plus tôt"
          libellePlus="Départ 5 minutes plus tard"
          onChange={(departMinutes) => {
            onChange({ departMinutes });
          }}
        />
        <ReglageHeure
          variante="bloc"
          accent
          libelle="Sortie au plus tard à"
          minutes={criteres.limiteMinutes}
          min={LIMITE_MIN_MINUTES}
          max={LIMITE_MAX_MINUTES}
          pas={PAS_HEURE_MINUTES}
          libelleMoins="Sortie 5 minutes plus tôt"
          libellePlus="Sortie 5 minutes plus tard"
          onChange={(limiteMinutes) => {
            onChange({ limiteMinutes });
          }}
        />
      </div>

      <fieldset className="flex flex-col gap-2.5">
        <legend className={`${TITRE} mb-2.5`}>Genre</legend>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <Pastille
              key={genre.id}
              actif={criteres.genres.includes(genre.id)}
              onClick={() => {
                basculerGenre(genre.id);
              }}
            >
              {genre.libelle}
            </Pastille>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2.5">
        <label htmlFor={idAuteur} className={TITRE}>
          Auteur (facultatif)
        </label>
        <div className="flex gap-2">
          <input
            id={idAuteur}
            type="text"
            value={criteres.auteur}
            placeholder="Ex. Molière"
            onChange={(evenement) => {
              onChange({ auteur: evenement.target.value });
            }}
            className="min-h-11 min-w-0 flex-1 rounded-md border border-contour bg-fond px-3.5 text-base"
          />
          {criteres.auteur === '' ? null : (
            <button
              type="button"
              onClick={() => {
                onChange({ auteur: '' });
              }}
              className="min-h-11 rounded-md border border-filet px-3 text-sm hover:bg-surface-survol"
            >
              Effacer
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {options.auteursSuggeres
            .filter((auteur) => normaliser(auteur) !== recherche)
            .map((auteur) => (
              <Pastille
                key={auteur}
                variante="pointillee"
                actif={false}
                onClick={() => {
                  onChange({ auteur });
                }}
              >
                {auteur}
              </Pastille>
            ))}
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={criteres.masquerImpossibles}
        onClick={() => {
          onChange({ masquerImpossibles: !criteres.masquerImpossibles });
        }}
        className="flex min-h-12 items-center justify-between gap-3 text-left text-[15px]"
      >
        <span>Masquer les séances impossibles</span>
        <span
          aria-hidden="true"
          className={`flex h-[26px] w-[46px] flex-none rounded-full border border-contour p-[3px] ${
            criteres.masquerImpossibles ? 'justify-end bg-corail' : 'justify-start'
          }`}
        >
          <span className="size-[18px] rounded-full bg-texte" />
        </span>
      </button>
    </div>
  );
}
