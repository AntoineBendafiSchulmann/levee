import { useEffect, useLayoutEffect, useRef } from 'react';

import { Navbar } from '../components/Navbar';
import { CriteriaSheet } from '../criteria/CriteriaSheet';
import { CriteriaForm, type CriteriaOptions } from '../criteria/CriteriaForm';
import { TimeStepper } from '../criteria/TimeStepper';
import { EXIT_LIMIT_MAX_MINUTES, EXIT_LIMIT_MIN_MINUTES, TIME_STEP_MINUTES } from '../domain/timeBounds';
import { genreLabel } from '../domain/genres';
import { viewButtonLabel, countersLabel, type Results } from '../domain/results';
import { formatTime, dayShortLabel, dayLongLabel } from '../domain/time';
import { pluralize } from '../domain/text';
import { focusByKey, scrollIntoReadingView } from '../navigation/focus';
import type { Bookings } from '../bookings/useBookings';
import type { Journey } from '../navigation/useJourney';
import { PerformanceCard } from '../components/PerformanceCard';
import { UNCERTAIN_PATTERN, TRAVEL_PATTERN } from '../components/Timeline';

interface Props {
  readonly journey: Journey;
  readonly bookings: Bookings;
  readonly today: string;
  readonly options: CriteriaOptions;
  readonly results: Results;
}

const CHIP_CLASSES = 'min-h-11 flex-none rounded-full border border-filet bg-surface px-3.5 text-sm font-semibold whitespace-nowrap';

/**
 * Performances that fit in the evening, one card per performance. Criteria are adjusted live:
 * sticky bar and sheet on mobile and tablet, fixed left column on large screens.
 */
export function ResultsPage({ journey, bookings, today, options, results }: Props) {
  const { criteria, readScrollPosition, rememberScrollPosition } = journey;
  const scroller = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const header = useRef<HTMLDivElement>(null);
  const shouldFocus = journey.hasNavigated;
  const { returnFocusKey } = journey;

  // On return, the list recovers its scroll position.
  useLayoutEffect(() => {
    if (scroller.current !== null) {
      scroller.current.scrollTop = readScrollPosition('results');
    }
  }, [readScrollPosition]);

  // After a navigation (link, button, browser back), focus moves to the page title; on return
  // from a play page, it goes back to the card the user left from. The restored position is only corrected if that link
  // is outside the reading area (for example after a refresh, which resets scrolling) or
  // under the sticky banner: a link that is already visible does not move.
  useEffect(() => {
    if (!shouldFocus) {
      return;
    }
    const card = returnFocusKey === null ? null : focusByKey(returnFocusKey);
    if (card === null) {
      title.current?.focus({ preventScroll: true });
    } else if (scroller.current !== null) {
      const headerBand = header.current;
      scrollIntoReadingView(card, scroller.current, headerBand !== null && headerBand.offsetHeight > 0 ? headerBand.getBoundingClientRect().bottom : 0);
    }
  }, [shouldFocus, returnFocusKey]);

  const departurePointLabel = options.departurePoints.find((o) => o.id === criteria.departurePointId)?.label ?? criteria.departurePointId;
  const form = (
    <CriteriaForm criteria={criteria} options={options} onChange={journey.updateCriteria} />
  );
  const activeFilters = criteria.genres.length > 0 || criteria.author !== '' || criteria.hideImpossible;
  const chips = [
    dayShortLabel(criteria.day, today),
    `Depuis ${departurePointLabel}`,
    `Départ ${formatTime(criteria.departureMinutes)}`,
    criteria.genres.length === 0 ? 'Tous genres' : criteria.genres.map(genreLabel).join(', '),
    ...(criteria.author === '' ? [] : [criteria.author]),
  ];
  const beforeCount = results.beforeDeparture.length;

  return (
    <div className="flex h-dvh flex-col">
      <Navbar screen="results" date={dayLongLabel(criteria.day)} onHome={journey.returnToHome} onEveningPerformances={journey.goToEveningPerformances} bookingCount={bookings.count} onOpenTickets={bookings.openTickets} />

      <div className="flex min-h-0 flex-1 bureau:grid bureau:grid-cols-[372px_minmax(0,1fr)]">
        <aside
          aria-label="Critères de la sortie"
          className="hidden overflow-y-auto border-r border-filet bg-surface bureau:block"
        >
          <h2 className="px-5 pt-[18px] pb-2.5 font-editorial text-[30px] leading-none font-normal italic">Votre sortie</h2>
          <div className="px-5 pt-2.5 pb-6">{form}</div>
        </aside>

        <main
          ref={scroller}
          onScroll={(event) => {
            rememberScrollPosition('results', event.currentTarget.scrollTop);
          }}
          className="min-h-0 min-w-0 flex-1 overflow-auto"
        >
          <div ref={header} className="sticky top-0 z-10 flex flex-col gap-2 border-b border-filet bg-fond px-4 py-2.5 tablette:px-6 bureau:hidden">
            <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
              <button
                type="button"
                onClick={journey.openCriteriaSheet}
                className="min-h-11 flex-none rounded-full border border-texte bg-texte px-3.5 text-sm font-bold text-fond"
              >
                Filtres
              </button>
              {chips.map((chip) => (
                <button key={chip} type="button" onClick={journey.openCriteriaSheet} className={CHIP_CLASSES}>
                  {chip}
                </button>
              ))}
            </div>
            <TimeStepper
              variant="bar"
              accent
              label="Sortie au plus tard à"
              minutes={criteria.exitLimitMinutes}
              min={EXIT_LIMIT_MIN_MINUTES}
              max={EXIT_LIMIT_MAX_MINUTES}
              step={TIME_STEP_MINUTES}
              decreaseLabel="Sortie 5 minutes plus tôt"
              increaseLabel="Sortie 5 minutes plus tard"
              onChange={(exitLimitMinutes) => {
                journey.updateCriteria({ exitLimitMinutes });
              }}
            />
          </div>

          <div className="mx-auto flex max-w-[1180px] flex-col gap-[18px] px-4 pt-[18px] pb-8 tablette:px-6 tablette:pt-[22px] tablette:pb-10 bureau:px-8 bureau:pt-7 bureau:pb-12">
            <div className="flex flex-col gap-1.5">
              <h1
                ref={title}
                tabIndex={-1}
                className="font-editorial text-[34px] leading-none font-normal outline-none tablette:text-[44px] bureau:text-5xl"
              >
                {dayLongLabel(criteria.day)}
              </h1>
              <p aria-live="polite" className="text-sm text-texte-doux">
                {countersLabel(results.counters, results.impossibleHidden)} · depuis {departurePointLabel} à{' '}
                {formatTime(criteria.departureMinutes)}
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-texte-doux">
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-0.5 w-[22px]" style={{ backgroundImage: TRAVEL_PATTERN }} />
                  Trajet estimé
                </li>
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-2 w-[22px] bg-texte" />
                  Représentation
                </li>
                <li className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="h-2 w-[22px] outline outline-attention"
                    style={{ background: UNCERTAIN_PATTERN }}
                  />
                  Fin incertaine
                </li>
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-3.5 w-0.5 bg-corail" />
                  Votre limite
                </li>
              </ul>
            </div>

            {results.visible.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 rounded-md border border-dashed border-contour px-5 py-7 text-center">
                <p className="font-editorial text-[26px] italic">Aucune séance ne correspond.</p>
                {activeFilters ? (
                  <button
                    type="button"
                    onClick={() => {
                      journey.updateCriteria({ genres: [], author: '', hideImpossible: false });
                    }}
                    className="min-h-11 rounded-full border border-contour px-[18px] font-semibold hover:bg-surface-survol"
                  >
                    Retirer genre et auteur
                  </button>
                ) : (
                  <p className="text-sm text-texte-doux">Essayez un autre jour ou un départ plus tôt.</p>
                )}
              </div>
            ) : (
              <ul className="grid grid-cols-1 items-start gap-3 tablette:grid-cols-2">
                {results.visible.map((result) => (
                  <li key={result.id}>
                    <PerformanceCard
                      result={result}
                      criteria={criteria}
                      departurePointLabel={departurePointLabel}
                      onOpen={(id) => {
                        journey.openPlay({ type: 'performance', id }, 'results', id);
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}

            {beforeCount === 0 ? null : (
              <p className="text-[13px] leading-[1.45] text-texte-doux">
                {pluralize(beforeCount, 'séance commence', 'séances commencent')} avant votre départ de{' '}
                {formatTime(criteria.departureMinutes)} et {beforeCount > 1 ? 'ne sont pas listées' : 'n’est pas listée'} :{' '}
                {results.beforeDeparture.map((s) => `${s.title} (${formatTime(s.startMinutes)})`).join(', ')}.
              </p>
            )}
          </div>
        </main>
      </div>

      <CriteriaSheet
        isOpen={journey.criteriaSheetOpen}
        onClose={journey.closeCriteriaSheet}
        viewLabel={viewButtonLabel(results.visible.length)}
        onView={journey.closeCriteriaSheet}
      >
        {form}
      </CriteriaSheet>
    </div>
  );
}
