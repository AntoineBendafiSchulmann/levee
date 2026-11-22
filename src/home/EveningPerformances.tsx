import type { Ref } from 'react';

import { onPlainClick } from '../components/plainClick';
import { countersLabel, type Results, type PerformanceResult } from '../domain/results';
import { formatTime } from '../domain/time';
import type { OutingCriteria } from '../domain/types';
import { EVENING_ANCHOR_ID } from '../navigation/routes';
import { PerformanceCard } from '../components/PerformanceCard';

interface Props {
  readonly performances: readonly PerformanceResult[];
  readonly results: Results;
  readonly criteria: OutingCriteria;
  readonly departurePointLabel: string;
  /** Opens the exact performance's detail page; the identifier also designates the card that will regain focus. */
  readonly onOpen: (id: string) => void;
  /** « Voir tous les résultats »: the full list (`/seances`), with the current criteria. */
  readonly onViewAll: () => void;
  readonly onEdit: () => void;
  readonly sectionRef: Ref<HTMLElement>;
  readonly titleRef: Ref<HTMLHeadingElement>;
}

const BUTTON =
  'inline-flex min-h-11 items-center rounded-full border border-contour px-[18px] text-[15px] font-semibold hover:bg-surface-survol';

/**
 * Under the home page: at most three performances that fit the evening, taken from the already computed results.
 * The full list, with filters and counters, stays on `/seances`.
 */
export function EveningPerformances({ performances, results, criteria, departurePointLabel, onOpen, onViewAll, onEdit, sectionRef, titleRef }: Props) {
  return (
    <section
      ref={sectionRef}
      id={EVENING_ANCHOR_ID}
      aria-labelledby="evening-performances-title"
      className="border-t border-filet px-4 pt-10 pb-14 tablette:px-8 bureau:px-0 ultra:pt-16 ultra:pb-24"
    >
      <div className="mx-auto flex max-w-[1100px] flex-col gap-5 ultra:max-w-[1560px] ultra:gap-8">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="flex flex-col gap-2">
            <h2
              ref={titleRef}
              id="evening-performances-title"
              tabIndex={-1}
              className="font-editorial text-[32px] leading-none font-normal outline-none tablette:text-[40px] bureau:text-[44px] ultra:text-[60px]"
            >
              Les séances qui rentrent <span className="text-corail italic">dans votre soirée</span>
            </h2>
            <p className="text-sm text-texte-doux">
              {countersLabel(results.counters, results.impossibleHidden)} · depuis {departurePointLabel} à{' '}
              {formatTime(criteria.departureMinutes)}, sorti avant {formatTime(criteria.exitLimitMinutes)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onEdit} className={BUTTON}>
              Modifier mes critères
            </button>
            <a
              href="/seances"
              onClick={onPlainClick(onViewAll)}
              className={`${BUTTON} border-corail text-corail`}
            >
              Voir tous les résultats →
            </a>
          </div>
        </div>

        {performances.length === 0 ? (
          <p className="rounded-md border border-dashed border-contour px-5 py-7 text-center font-editorial text-[26px] italic">
            Aucune séance ne rentre dans cette soirée.
          </p>
        ) : (
          <ul className="grid grid-cols-1 items-start gap-3 tablette:grid-cols-2 bureau:grid-cols-3 ultra:gap-5">
            {performances.map((result) => (
              <li key={result.id}>
                <PerformanceCard result={result} criteria={criteria} departurePointLabel={departurePointLabel} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
