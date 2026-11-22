import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import { Navbar } from '../components/Navbar';
import { CriteriaSheet } from '../criteria/CriteriaSheet';
import { CriteriaForm, type CriteriaOptions } from '../criteria/CriteriaForm';
import { viewButtonLabel, countersLabel, type Results } from '../domain/results';
import { formatTime, dayShortLabel, dayPhrase, dayLongLabel } from '../domain/time';
import type { IsoDay, Venue, Play } from '../domain/types';
import { focusByKey, scrollIntoReadingView } from '../navigation/focus';
import type { Bookings } from '../bookings/useBookings';
import type { Journey } from '../navigation/useJourney';
import { HomeActions } from './HomeActions';
import { PosterCarousel } from './PosterCarousel';
import { buildSlides } from './posterSlides';
import { selectEveningPerformances } from './selectEveningPerformances';
import { EveningPerformances } from './EveningPerformances';
import { useReducedMotion } from './useReducedMotion';

interface Props {
  readonly journey: Journey;
  readonly bookings: Bookings;
  /** Current day: « ce soir » refers to this day. */
  readonly today: IsoDay;
  readonly plays: readonly Play[];
  readonly venues: readonly Venue[];
  readonly options: CriteriaOptions;
  readonly results: Results;
}

/**
 * Home page « Que voir ce soir ? »: the play on show with its performances, then, below, the performances that
 * fit in the evening. « Voir les séances » and « Voir tous les résultats » open the full list;
 * « Préparer une autre sortie » and the chips open the criteria sheet; activating the poster or a
 * performance opens the detail page. The page scrolls within its container: its position is remembered for the return.
 */
export function HomePage({ journey, bookings, today, plays, venues, options, results }: Props) {
  const { criteria, returnFocusKey, readScrollPosition, rememberScrollPosition, readActivePlay, rememberActivePlay, consumeAnchor } = journey;
  const reduceMotion = useReducedMotion();
  const scroller = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const section = useRef<HTMLElement>(null);
  const eveningPerformancesTitle = useRef<HTMLHeadingElement>(null);
  /** Set to the evening performances section when arriving via « Séances de la soirée » from another page. */
  const anchor = useRef<'evening-performances' | null>(null);
  const shouldFocus = journey.hasNavigated;
  const slides = buildSlides(plays, venues, criteria, today);
  const eveningPerformances = selectEveningPerformances(results);
  const when = dayPhrase(criteria.day, today);
  const departurePointLabel = options.departurePoints.find((o) => o.id === criteria.departurePointId)?.label ?? criteria.departurePointId;
  const onActivePlay = useCallback(
    (id: string) => {
      rememberActivePlay(id);
    },
    [rememberActivePlay],
  );

  // Reading position: at the top, at « Séances de la soirée » when coming from another page, or the one saved for the return.
  useLayoutEffect(() => {
    const page = scroller.current;
    if (page === null) {
      return;
    }
    anchor.current = consumeAnchor() ?? anchor.current;
    page.scrollTop = anchor.current === 'evening-performances' ? (section.current?.offsetTop ?? 0) : readScrollPosition('home');
  }, [consumeAnchor, readScrollPosition]);

  // After a navigation, focus goes to the page title; when returning from a detail page, it goes back to the
  // element the user left from (active poster, performance under the poster or evening card), scrolled into view.
  useEffect(() => {
    if (!shouldFocus) {
      return;
    }
    if (anchor.current === 'evening-performances') {
      eveningPerformancesTitle.current?.focus({ preventScroll: true });
      return;
    }
    const element = returnFocusKey === null ? null : focusByKey(returnFocusKey);
    if (element === null) {
      title.current?.focus({ preventScroll: true });
    } else if (scroller.current !== null) {
      scrollIntoReadingView(element, scroller.current, 0);
    }
  }, [shouldFocus, returnFocusKey]);

  const behavior = reduceMotion ? 'auto' : 'smooth';
  const scrollToTop = () => {
    scroller.current?.scrollTo({ top: 0, behavior: behavior });
    title.current?.focus({ preventScroll: true });
  };
  const scrollToEveningPerformances = () => {
    scroller.current?.scrollTo({ top: section.current?.offsetTop ?? 0, behavior: behavior });
    eveningPerformancesTitle.current?.focus({ preventScroll: true });
  };

  return (
    <div className="flex h-dvh flex-col">
      <Navbar screen="home" date={dayLongLabel(criteria.day)} onHome={scrollToTop} onEveningPerformances={scrollToEveningPerformances} bookingCount={bookings.count} onOpenTickets={bookings.openTickets} />

      <main
        ref={scroller}
        onScroll={(event) => {
          rememberScrollPosition('home', event.currentTarget.scrollTop);
        }}
        className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
      >
        <PosterCarousel
          slides={slides}
          readInitialPlayId={() => (returnFocusKey !== null && slides.some((d) => d.id === returnFocusKey) ? returnFocusKey : readActivePlay())}
          onActivePlay={onActivePlay}
          onOpenPlay={(slide) => {
            journey.openPlay({ type: 'play', id: slide.id }, 'home', slide.id);
          }}
          onOpenPerformance={(id, focusKey) => {
            journey.openPlay({ type: 'performance', id }, 'home', focusKey);
          }}
          criteriaRecap={`Depuis ${departurePointLabel} à ${formatTime(criteria.departureMinutes)}`}
          intro={
            <div className="flex flex-col gap-1.5">
              <p className="text-xs leading-[1.2] font-semibold tracking-[0.14em] text-texte-doux uppercase">
                {dayLongLabel(criteria.day)} · à l’affiche
              </p>
              <h1
                ref={title}
                tabIndex={-1}
                className="font-editorial text-[30px] leading-none font-normal tracking-[-0.01em] outline-none tablette:text-[44px] ultra:text-[64px]"
              >
                Que voir <span className="text-corail italic">ce soir</span> ?
              </h1>
            </div>
          }
          actions={
            <HomeActions
              chips={[
                { label: 'Depuis', value: departurePointLabel },
                { label: '', value: dayShortLabel(criteria.day, today) },
                { label: 'Sortie au plus tard à', value: formatTime(criteria.exitLimitMinutes) },
              ]}
              viewLabel={`Voir les séances de ${when}`}
              viewDetail={countersLabel(results.counters, results.impossibleHidden)}
              onView={journey.goToResults}
              onEdit={journey.openCriteriaSheet}
            />
          }
        />

        <EveningPerformances
          performances={eveningPerformances}
          results={results}
          criteria={criteria}
          departurePointLabel={departurePointLabel}
          onOpen={(id) => {
            journey.openPlay({ type: 'performance', id }, 'home', id);
          }}
          onViewAll={journey.goToResults}
          onEdit={journey.openCriteriaSheet}
          sectionRef={section}
          titleRef={eveningPerformancesTitle}
        />
      </main>

      <CriteriaSheet
        isOpen={journey.criteriaSheetOpen}
        onClose={journey.closeCriteriaSheet}
        viewLabel={viewButtonLabel(results.visible.length)}
        onView={journey.goToResults}
      >
        <CriteriaForm criteria={criteria} options={options} onChange={journey.updateCriteria} />
      </CriteriaSheet>
    </div>
  );
}
