import { useId } from 'react';

import {
  DEPARTURE_MAX_MINUTES,
  DEPARTURE_MIN_MINUTES,
  EXIT_LIMIT_MAX_MINUTES,
  EXIT_LIMIT_MIN_MINUTES,
  TIME_STEP_MINUTES,
} from '../domain/timeBounds';
import { GENRES } from '../domain/genres';
import { dayShortLabel } from '../domain/time';
import { normalizeText } from '../domain/text';
import type { OutingCriteria, GenreId, IsoDay, DeparturePoint } from '../domain/types';
import { Chip } from './Chip';
import { TimeStepper } from './TimeStepper';

/** What the form offers: depends on the available data. */
export interface CriteriaOptions {
  readonly today: IsoDay;
  readonly days: readonly IsoDay[];
  readonly departurePoints: readonly DeparturePoint[];
  readonly suggestedAuthors: readonly string[];
}

interface Props {
  readonly criteria: OutingCriteria;
  readonly options: CriteriaOptions;
  /** Each change is applied to the results immediately. */
  readonly onChange: (change: Partial<OutingCriteria>) => void;
}

const TITLE = 'text-xs font-semibold tracking-[0.12em] text-texte-doux uppercase';

export function CriteriaForm({ criteria, options, onChange }: Props) {
  const authorInputId = useId();
  const query = normalizeText(criteria.author);

  const toggleGenre = (id: GenreId) => {
    const nextGenres = criteria.genres.includes(id)
      ? criteria.genres.filter((genre) => genre !== id)
      : GENRES.map((genre) => genre.id).filter((genre) => genre === id || criteria.genres.includes(genre));
    onChange({ genres: nextGenres });
  };

  return (
    <div className="flex flex-col gap-[22px]">
      <fieldset className="flex flex-col gap-2.5">
        <legend className={`${TITLE} mb-2.5`}>Jour</legend>
        <div className="grid grid-cols-4 gap-1.5">
          {options.days.map((day) => (
            <Chip
              key={day}
              variant="square"
              active={criteria.day === day}
              onClick={() => {
                onChange({ day });
              }}
            >
              {dayShortLabel(day, options.today)}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2.5">
        <legend className={`${TITLE} mb-2.5`}>Point de départ</legend>
        <div className="flex flex-wrap gap-2">
          {options.departurePoints.map((point) => (
            <Chip
              key={point.id}
              active={criteria.departurePointId === point.id}
              onClick={() => {
                onChange({ departurePointId: point.id });
              }}
            >
              {point.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-x-4 gap-y-[18px]">
        <TimeStepper
          variant="block"
          label="Heure de départ"
          minutes={criteria.departureMinutes}
          min={DEPARTURE_MIN_MINUTES}
          max={DEPARTURE_MAX_MINUTES}
          step={TIME_STEP_MINUTES}
          decreaseLabel="Départ 5 minutes plus tôt"
          increaseLabel="Départ 5 minutes plus tard"
          onChange={(departureMinutes) => {
            onChange({ departureMinutes });
          }}
        />
        <TimeStepper
          variant="block"
          accent
          label="Sortie au plus tard à"
          minutes={criteria.exitLimitMinutes}
          min={EXIT_LIMIT_MIN_MINUTES}
          max={EXIT_LIMIT_MAX_MINUTES}
          step={TIME_STEP_MINUTES}
          decreaseLabel="Sortie 5 minutes plus tôt"
          increaseLabel="Sortie 5 minutes plus tard"
          onChange={(exitLimitMinutes) => {
            onChange({ exitLimitMinutes });
          }}
        />
      </div>

      <fieldset className="flex flex-col gap-2.5">
        <legend className={`${TITLE} mb-2.5`}>Genre</legend>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <Chip
              key={genre.id}
              active={criteria.genres.includes(genre.id)}
              onClick={() => {
                toggleGenre(genre.id);
              }}
            >
              {genre.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2.5">
        <label htmlFor={authorInputId} className={TITLE}>
          Auteur (facultatif)
        </label>
        <div className="flex gap-2">
          <input
            id={authorInputId}
            type="text"
            value={criteria.author}
            placeholder="Ex. Molière"
            onChange={(event) => {
              onChange({ author: event.target.value });
            }}
            className="min-h-11 min-w-0 flex-1 rounded-md border border-contour bg-fond px-3.5 text-base"
          />
          {criteria.author === '' ? null : (
            <button
              type="button"
              onClick={() => {
                onChange({ author: '' });
              }}
              className="min-h-11 rounded-md border border-filet px-3 text-sm hover:bg-surface-survol"
            >
              Effacer
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {options.suggestedAuthors
            .filter((author) => normalizeText(author) !== query)
            .map((author) => (
              <Chip
                key={author}
                variant="dashed"
                active={false}
                onClick={() => {
                  onChange({ author });
                }}
              >
                {author}
              </Chip>
            ))}
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={criteria.hideImpossible}
        onClick={() => {
          onChange({ hideImpossible: !criteria.hideImpossible });
        }}
        className="flex min-h-12 items-center justify-between gap-3 text-left text-[15px]"
      >
        <span>Masquer les séances impossibles</span>
        <span
          aria-hidden="true"
          className={`flex h-[26px] w-[46px] flex-none rounded-full border border-contour p-[3px] ${
            criteria.hideImpossible ? 'justify-end bg-corail' : 'justify-start'
          }`}
        >
          <span className="size-[18px] rounded-full bg-texte" />
        </span>
      </button>
    </div>
  );
}
