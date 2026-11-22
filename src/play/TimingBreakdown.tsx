import { useId, useState } from 'react';

import { TIGHT_ARRIVAL_THRESHOLD_MINUTES } from '../domain/evaluation';
import type { PerformanceResult } from '../domain/results';
import { formatDistance, formatDuration, formatTime, formatTimeRange } from '../domain/time';
import type { OutingCriteria } from '../domain/types';

interface Props {
  readonly result: PerformanceResult;
  readonly criteria: OutingCriteria;
  readonly departurePointLabel: string;
}

/** Where a value comes from: typed by the user, estimated, computed by the app, or announced by the theatre. */
type RowKind = 'entered' | 'estimated' | 'computed' | 'announced';

interface Row {
  readonly label: string;
  readonly value: string;
  readonly kind?: RowKind;
  readonly note?: string;
  readonly colorClass?: string;
  readonly strong?: boolean;
  /** Margin: italic, dotted row, deduced from the neighbouring rows. */
  readonly margin?: boolean;
}

const COLOR = { ok: 'text-ok', attention: 'text-attention', danger: 'text-danger' } as const;

const KIND_LABEL: Readonly<Record<RowKind, string>> = {
  entered: 'Votre saisie',
  estimated: 'Estimation',
  computed: 'Calculé',
  announced: 'Annoncé',
};

const KIND_CLASSES: Readonly<Record<RowKind, string>> = {
  entered: 'border-solid border-texte',
  estimated: 'border-dashed border-texte',
  computed: 'border-solid border-texte bg-texte text-fond',
  announced: 'border-solid border-texte',
};

function buildRows({ evaluation, play, performance }: PerformanceResult, criteria: OutingCriteria, departurePointLabel: string, description: string | undefined): Row[] {
  const { status, travelMinutes, arrivalMinutes, arrivalMarginMinutes: margin, end } = evaluation;
  const result: Row[] = [
    { label: `Départ · ${departurePointLabel}`, value: formatTime(criteria.departureMinutes), kind: 'entered' },
    travelMinutes === null
      ? { label: 'Trajet estimé', value: 'Non estimé', note: `Aucune estimation depuis ${departurePointLabel}`, colorClass: COLOR.attention }
      : {
          label: 'Trajet estimé',
          value: `${String(travelMinutes)} min`,
          kind: 'estimated',
          ...(description === undefined ? {} : { note: description }),
        },
    arrivalMinutes === null
      ? { label: 'Arrivée estimée', value: '?', note: 'Impossible sans trajet estimé', strong: true }
      : { label: 'Arrivée estimée', value: formatTime(arrivalMinutes), kind: 'computed', note: 'Départ + trajet estimé', strong: true },
    { label: 'Début de la représentation', value: formatTime(performance.startMinutes), kind: 'announced', note: 'Horaire publié par le théâtre' },
    {
      label: 'Marge à l’arrivée',
      value: margin === null ? '—' : margin >= 0 ? `${String(margin)} min` : `${String(-margin)} min de retard`,
      margin: true,
      colorClass: margin === null ? '' : margin < 0 ? COLOR.danger : margin < TIGHT_ARRIVAL_THRESHOLD_MINUTES ? COLOR.attention : COLOR.ok,
    },
  ];

  if (play.announcedDurations.length === 0) {
    result.push({
      label: 'Durée annoncée',
      value: 'Non communiquée',
      note: 'Ni le théâtre ni la billetterie ne l’indiquent',
      colorClass: COLOR.attention,
    });
  } else {
    for (const duration of play.announcedDurations) {
      result.push({ label: 'Durée annoncée', value: formatDuration(duration.minutes), kind: 'announced', note: `Source : ${duration.source}` });
    }
  }

  result.push(
    end === null
      ? { label: 'Fin calculée', value: '?', note: 'Impossible sans durée', strong: true, colorClass: COLOR.attention }
      : {
          label: 'Fin calculée',
          value: formatTimeRange(end),
          kind: 'computed',
          note: end.min === end.max ? 'Début + durée annoncée' : 'Début + durée la plus courte / la plus longue',
          strong: true,
          colorClass: status === 'uncertain-end' ? COLOR.attention : status === 'ends-too-late' ? COLOR.danger : '',
        },
    { label: 'Limite de sortie', value: formatTime(criteria.exitLimitMinutes), kind: 'entered' },
  );

  let exitMargin: { value: string; colorClass: string };
  if (end === null) {
    exitMargin = { value: `durée max. ${formatDuration(Math.max(0, criteria.exitLimitMinutes - performance.startMinutes))}`, colorClass: COLOR.attention };
  } else if (end.max <= criteria.exitLimitMinutes) {
    exitMargin = { value: `${String(criteria.exitLimitMinutes - end.max)} min`, colorClass: COLOR.ok };
  } else if (end.min > criteria.exitLimitMinutes) {
    exitMargin = { value: `${String(end.min - criteria.exitLimitMinutes)} min de dépassement`, colorClass: COLOR.danger };
  } else {
    exitMargin = { value: `+${String(criteria.exitLimitMinutes - end.min)} à −${String(end.max - criteria.exitLimitMinutes)} min`, colorClass: COLOR.attention };
  }
  result.push({ label: 'Marge à la sortie', value: exitMargin.value, colorClass: exitMargin.colorClass, margin: true });
  return result;
}

/**
 * « Trajet et calcul horaire »: the breakdown of the selected performance's calculation, row by row, with the nature
 * of each value (typed, estimated, computed or announced by the theatre). Collapsed by default.
 */
export function TimingBreakdown({ result, criteria, departurePointLabel }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const travelEstimate = result.venue.travelEstimates[criteria.departurePointId];
  const detail = buildRows(result, criteria, departurePointLabel, travelEstimate?.description);
  const distance = travelEstimate?.distanceKm === undefined ? '' : `Distance : ${formatDistance(travelEstimate.distanceKm)}. `;
  const means = travelEstimate?.description === undefined ? '' : ` (${travelEstimate.description.charAt(0).toLowerCase()}${travelEstimate.description.slice(1)})`;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen((previous) => !previous);
        }}
        className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-filet px-4 text-[15px] font-semibold hover:bg-surface-survol"
      >
        <span>Trajet et calcul horaire</span>
        <span aria-hidden="true" className="text-xl leading-none">
          {open ? '−' : '+'}
        </span>
      </button>
      <div id={panelId} hidden={!open}>
        <ul className="flex flex-col">
          {detail.map((row, i) => (
            <li
              key={`${row.label}-${String(i)}`}
              className={`grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-filet py-2.5 ${row.margin === true ? 'border-dashed' : ''}`}
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className={`text-sm ${row.strong === true ? 'font-bold' : 'font-medium'} ${row.margin === true ? 'italic' : ''}`}>{row.label}</span>
                {row.note === undefined ? null : <span className="text-xs text-texte-doux">{row.note}</span>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[17px] font-bold whitespace-nowrap ${row.colorClass ?? ''}`}>{row.value}</span>
                {row.kind === undefined ? null : (
                  <span className={`rounded-[2px] border px-1.5 py-0.5 text-[10px] font-bold tracking-[0.1em] uppercase ${KIND_CLASSES[row.kind]}`}>
                    {KIND_LABEL[row.kind]}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] leading-[1.45] text-pretty text-texte-doux">
          {distance}
          {distance === '' ? '' : 'La distance seule ne dit pas si vous arriverez à temps ; le calcul s’appuie sur le trajet estimé'}
          {distance === '' ? '' : `${means}. `}
          Une arrivée à moins de {TIGHT_ARRIVAL_THRESHOLD_MINUTES} min du début est signalée comme serrée.
        </p>
      </div>
    </div>
  );
}
