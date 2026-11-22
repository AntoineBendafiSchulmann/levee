import type { PerformanceGroup } from '../domain/evaluation';

interface Props {
  readonly departureMinutes: number;
  readonly arrivalMinutes: number | null;
  readonly startMinutes: number;
  readonly end: { readonly min: number; readonly max: number } | null;
  readonly exitLimitMinutes: number;
  readonly group: PerformanceGroup;
}

/** Patterns reused by the results legend. */
export const UNCERTAIN_PATTERN =
  'repeating-linear-gradient(45deg, var(--color-attention) 0 3px, transparent 3px 6px)';
export const TRAVEL_PATTERN = 'repeating-linear-gradient(90deg, var(--color-texte) 0 4px, transparent 4px 7px)';

const percent = (value: number): string => `${String(value)}%`;

/**
 * Evening timeline: estimated travel (dashes), performance (solid bar; gradient if the duration
 * is unknown), uncertain end range (hatching) and time limit (coral line). Decorative:
 * the same information is written in the card.
 */
export function Timeline({ departureMinutes, arrivalMinutes, startMinutes, end, exitLimitMinutes, group }: Props) {
  const axisStart = Math.floor(departureMinutes / 60) * 60;
  const axisEnd = Math.max(23 * 60 + 30, exitLimitMinutes + 30);
  const position = (minutes: number) => Math.max(0, Math.min(100, ((minutes - axisStart) / (axisEnd - axisStart)) * 100));
  const strip = 'absolute motion-safe:transition-[left,width] motion-safe:duration-[350ms]';

  return (
    <div aria-hidden="true" className="relative h-4 w-full">
      <div className="absolute inset-x-0 top-[7px] h-0.5 bg-filet" />
      {arrivalMinutes === null ? null : (
        <div
          className={`${strip} top-[7px] h-0.5`}
          style={{
            left: percent(position(departureMinutes)),
            width: percent(position(arrivalMinutes) - position(departureMinutes)),
            backgroundImage: TRAVEL_PATTERN,
          }}
        />
      )}
      <div
        className={`${strip} top-1 h-2`}
        style={{
          left: percent(position(startMinutes)),
          width: percent((end === null ? 100 : position(end.min)) - position(startMinutes)),
          background:
            end === null
              ? 'linear-gradient(90deg, var(--color-attention), transparent)'
              : group === 'impossible'
                ? 'oklch(0.55 0.015 285)'
                : 'var(--color-texte)',
        }}
      />
      {end !== null && end.max > end.min ? (
        <div
          className={`${strip} top-1 h-2 outline outline-attention`}
          style={{
            left: percent(position(end.min)),
            width: percent(position(end.max) - position(end.min)),
            background: UNCERTAIN_PATTERN,
          }}
        />
      ) : null}
      <div
        className="absolute inset-y-0 w-0.5 bg-corail motion-safe:transition-[left] motion-safe:duration-[350ms] motion-safe:ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ left: percent(position(exitLimitMinutes)) }}
      />
    </div>
  );
}
