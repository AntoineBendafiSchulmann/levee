import type { Evaluation } from '../domain/evaluation';
import { formatTime, formatTimeRange, dayShortLabel } from '../domain/time';
import type { IsoDay, Performance } from '../domain/types';
import { STATUS_LABEL, GROUP_DOT, GROUP_TEXT } from '../components/statusPresentation';

export interface PerformanceRow {
  readonly id: string;
  readonly performance: Performance;
  readonly evaluation: Evaluation;
}

interface Props {
  readonly days: readonly IsoDay[];
  readonly shownDay: IsoDay;
  readonly today: IsoDay;
  readonly performanceRows: readonly PerformanceRow[];
  readonly selectedPerformanceId: string;
  readonly onSelectDay: (day: IsoDay) => void;
  readonly onSelectPerformance: (id: string) => void;
}

function arrivalRow({ arrivalMinutes, arrivalMarginMinutes: margin }: Evaluation): string {
  if (arrivalMinutes === null || margin === null) {
    return 'Arrivée non estimable · trajet non estimé';
  }
  const delta = margin >= 0 ? `${String(margin)} min avant` : `${String(-margin)} min après le début`;
  return `Arrivée estimée ${formatTime(arrivalMinutes)} · ${delta}`;
}

function exitRow({ end }: Evaluation): string {
  if (end === null) {
    return 'Sortie non calculable · durée inconnue';
  }
  return `Sortie calculée ${formatTimeRange(end)}`;
}

/** Day tabs, then the performances of that day. A tab filters the list; only clicking a time changes the selected performance. */
export function PerformancePicker({ days, shownDay, today, performanceRows, selectedPerformanceId, onSelectDay, onSelectPerformance }: Props) {
  return (
    <>
      <div role="group" aria-label="Jour" className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
        {days.map((day) => (
          <button
            key={day}
            type="button"
            aria-pressed={day === shownDay}
            onClick={() => {
              onSelectDay(day);
            }}
            className="min-h-11 flex-none rounded-full border border-filet px-4 text-sm font-bold aria-pressed:border-texte aria-pressed:bg-texte aria-pressed:text-fond"
          >
            {dayShortLabel(day, today)}
          </button>
        ))}
      </div>
      <ul aria-label="Séances de ce jour" className="flex flex-col gap-2">
        {performanceRows.map(({ id, performance, evaluation }) => {
          const isSelected = id === selectedPerformanceId;
          return (
            <li key={id}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  onSelectPerformance(id);
                }}
                className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 rounded-md border-2 p-3.5 text-left ${isSelected ? 'border-texte bg-surface-2' : 'border-filet hover:bg-surface-survol'}`}
              >
                <span className="text-[32px] leading-none font-extrabold tracking-[-0.03em]">{formatTime(performance.startMinutes)}</span>
                <span className="flex min-w-0 flex-col gap-[3px]">
                  <span className={`inline-flex items-center gap-[7px] text-xs font-bold tracking-[0.08em] uppercase ${GROUP_TEXT[evaluation.group]}`}>
                    <span aria-hidden="true" className={`size-2 flex-none rounded-full ${GROUP_DOT[evaluation.group]}`} />
                    {STATUS_LABEL[evaluation.status]}
                  </span>
                  <span className="text-sm leading-[1.35]">{arrivalRow(evaluation)}</span>
                  <span className="text-sm leading-[1.35]">{exitRow(evaluation)}</span>
                </span>
                <span aria-hidden="true" className={`flex size-[22px] items-center justify-center rounded-full border-2 ${isSelected ? 'border-texte' : 'border-contour'}`}>
                  <span className={`size-2.5 rounded-full ${isSelected ? 'bg-texte' : 'bg-transparent'}`} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
