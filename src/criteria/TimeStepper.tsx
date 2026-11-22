import { formatTime } from '../domain/time';

interface Props {
  readonly label: string;
  readonly minutes: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly onChange: (minutes: number) => void;
  readonly decreaseLabel: string;
  readonly increaseLabel: string;
  /** `block`: setting in the criteria sheet; `bar`: compact version for the results bar. */
  readonly variant: 'block' | 'bar';
  readonly accent?: boolean;
}

const BUTTON =
  'grid size-11 flex-none place-items-center rounded-full border border-contour text-[22px] hover:bg-surface-survol aria-disabled:opacity-40 aria-disabled:hover:bg-transparent';

/**
 * A time adjustable by step, bounded. At the bounds, the buttons are visually dimmed (`aria-disabled`) without
 * losing focus: a `disabled` would drop it onto the page for a keyboard user.
 */
export function TimeStepper({
  label,
  minutes,
  min,
  max,
  step,
  onChange,
  decreaseLabel,
  increaseLabel,
  variant,
  accent = false,
}: Props) {
  const isCompact = variant === 'bar';
  return (
    <div className={isCompact ? 'flex items-center justify-between gap-2.5' : 'flex flex-col gap-2'}>
      <span className={isCompact ? 'text-sm text-texte-doux' : 'text-xs font-semibold tracking-[0.12em] text-texte-doux uppercase'}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={decreaseLabel}
          aria-disabled={minutes <= min}
          onClick={() => {
            onChange(Math.max(min, minutes - step));
          }}
          className={BUTTON}
        >
          −
        </button>
        <output
          className={`text-center font-bold tracking-[-0.02em] ${
            isCompact ? 'min-w-[78px] text-2xl font-extrabold' : 'flex-1 text-[28px]'
          } ${accent ? 'text-corail' : ''}`}
        >
          {formatTime(minutes)}
        </output>
        <button
          type="button"
          aria-label={increaseLabel}
          aria-disabled={minutes >= max}
          onClick={() => {
            onChange(Math.min(max, minutes + step));
          }}
          className={BUTTON}
        >
          +
        </button>
      </div>
    </div>
  );
}
