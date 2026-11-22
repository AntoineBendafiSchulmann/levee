import { Poster } from './Poster';
import { onPlainClick } from './plainClick';
import { genreLabel } from '../domain/genres';
import type { PerformanceResult } from '../domain/results';
import { buildPerformanceId } from '../domain/performances';
import { distinctDurations, formatDuration, formatTime, formatTimeRange, minutesLabel } from '../domain/time';
import type { OutingCriteria } from '../domain/types';
import { pathForTarget } from '../navigation/routes';
import { explainPerformance } from '../domain/explanation';
import { Timeline } from './Timeline';
import { STATUS_LABEL, GROUP_DOT as DOT, GROUP_TEXT as TEXT } from './statusPresentation';

interface Props {
  readonly result: PerformanceResult;
  readonly criteria: OutingCriteria;
  readonly departurePointLabel: string;
  /** Opens this performance's page (plain click; a modified click lets the browser follow the link). */
  readonly onOpen: (id: string) => void;
}

/** Subtitle of the « Sortie » column: the end is computed, never announced. */
function exitSubtitle(end: { min: number; max: number } | null, limit: number): string {
  if (end === null) {
    return 'non calculable';
  }
  if (end.min === end.max) {
    const delta = limit - end.min;
    if (delta === 0) {
      return 'calculée · pile à votre limite';
    }
    return delta > 0 ? `calculée · ${minutesLabel(delta)} avant la limite` : `calculée · ${minutesLabel(-delta)} après la limite`;
  }
  if (end.max <= limit) {
    return end.max === limit
      ? 'calculée · au plus tard pile à votre limite'
      : `calculée · au plus tard ${minutesLabel(limit - end.max)} avant la limite`;
  }
  return end.min > limit ? `calculée · ${minutesLabel(end.min - limit)} après la limite` : 'calculée · deux durées annoncées';
}

function Column({ title, value, rows, toneClass }: { title: string; value: string; rows: readonly string[]; toneClass: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-[11px] font-semibold tracking-[0.1em] text-texte-doux uppercase">{title}</dt>
      <dd className={`text-xl leading-[1.1] font-extrabold tracking-[-0.02em] ${toneClass}`}>{value}</dd>
      {rows.map((row) => (
        <dd key={row} className={`text-xs leading-[1.3] ${toneClass === '' ? 'text-texte-doux' : toneClass}`}>
          {row}
        </dd>
      ))}
    </div>
  );
}

/**
 * One card = one performance. Three columns distinguish what is estimated (the arrival, from the travel),
 * announced (the start and the duration) and computed (the exit).
 */
export function PerformanceCard({ result, criteria, departurePointLabel, onOpen }: Props) {
  const { evaluation, play, venue, performance } = result;
  const { status, group, arrivalMinutes, arrivalMarginMinutes: margin, travelMinutes, end } = evaluation;
  const distinctMinutes = distinctDurations(play.announcedDurations);
  const explanation = explainPerformance(result, criteria, departurePointLabel);
  const id = buildPerformanceId(play, performance);

  const arrivalClass = margin !== null && margin < 0 ? 'text-danger' : status === 'tight-arrival' ? 'text-attention' : '';
  const startClass = distinctMinutes.length === 1 ? '' : 'text-attention';
  const exitClass =
    status === 'ends-too-late' ? 'text-danger' : status === 'uncertain-end' || status === 'unknown-duration' ? 'text-attention' : '';

  const durationRow =
    distinctMinutes.length === 0
      ? 'annoncé · durée non annoncée'
      : distinctMinutes.length === 1
        ? `annoncé · durée ${formatDuration(distinctMinutes[0] ?? 0)}`
        : `annoncé · durées ${distinctMinutes.map(formatDuration).join(' ou ')}`;

  return (
    <article className="relative flex flex-col gap-3.5 rounded-md border border-filet bg-surface p-3.5 hover:bg-surface-survol">
      <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-3.5">
        <div>
          <Poster poster={play.poster} title={play.title} author={play.author} venueName={venue.name} />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <p className={`inline-flex items-center gap-[7px] text-xs font-bold tracking-[0.08em] uppercase ${TEXT[group]}`}>
            <span aria-hidden="true" className={`size-2 flex-none rounded-full ${DOT[group]}`} />
            {STATUS_LABEL[status]}
          </p>
          <h2 className="font-editorial text-[26px] leading-none font-normal text-pretty italic">
            <a
              href={pathForTarget({ type: 'performance', id })}
              data-focus-key={id}
              onClick={onPlainClick(() => {
                onOpen(id);
              })}
              className="after:absolute after:inset-0 after:rounded-md focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-corail"
            >
              {play.title}
              <span className="sr-only">
                , séance de {formatTime(performance.startMinutes)}, {STATUS_LABEL[status]}
              </span>
            </a>
          </h2>
          <p className="text-xs font-semibold tracking-[0.1em] text-texte-doux uppercase">
            {play.author} · {play.genres.map(genreLabel).join(', ')}
          </p>
          <p className="text-sm">
            {venue.name} · {venue.district}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)] gap-2.5 border-t border-filet pt-3">
        <Column
          title="Arrivée"
          value={arrivalMinutes === null ? '?' : formatTime(arrivalMinutes)}
          rows={[
            travelMinutes === null ? 'trajet non estimé' : `estimée · trajet ${minutesLabel(travelMinutes)}`,
            ...(margin === null ? [] : [margin >= 0 ? `${minutesLabel(margin)} avant le début` : `${minutesLabel(-margin)} après le début`]),
          ]}
          toneClass={arrivalClass}
        />
        <Column title="Début" value={formatTime(performance.startMinutes)} rows={[durationRow]} toneClass={startClass} />
        <Column
          title="Sortie"
          value={end === null ? '?' : formatTimeRange(end)}
          rows={[exitSubtitle(end, criteria.exitLimitMinutes)]}
          toneClass={exitClass}
        />
      </dl>

      {explanation === null ? null : (
        <p className={`text-sm leading-snug text-pretty ${TEXT[group]}`}>{explanation}</p>
      )}

      <Timeline
        departureMinutes={criteria.departureMinutes}
        arrivalMinutes={arrivalMinutes}
        startMinutes={performance.startMinutes}
        end={end}
        exitLimitMinutes={criteria.exitLimitMinutes}
        group={group}
      />
    </article>
  );
}
