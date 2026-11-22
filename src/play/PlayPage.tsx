import { useEffect, useRef, useState } from 'react';

import { Poster } from '../components/Poster';
import { Navbar } from '../components/Navbar';
import type { CriteriaOptions } from '../criteria/CriteriaForm';
import { genreLabel } from '../domain/genres';
import { availableDays } from '../domain/schedule';
import { performanceResult } from '../domain/results';
import { buildPerformanceId, resolvePlayPage } from '../domain/performances';
import { formatDuration, formatTime, dayBriefLabel, dayLongLabel } from '../domain/time';
import type { OutingCriteria, IsoDay, Venue, Play } from '../domain/types';
import { bookActionLabel } from '../bookings/bookingRules';
import type { Bookings } from '../bookings/useBookings';
import type { Journey } from '../navigation/useJourney';
import { performanceVerdict } from '../domain/explanation';
import { GROUP_BORDER, STATUS_LABEL, GROUP_DOT, GROUP_TEXT } from '../components/statusPresentation';
import { TimingBreakdown } from './TimingBreakdown';
import { PerformancePicker } from './PerformancePicker';

interface Props {
  readonly journey: Journey;
  readonly bookings: Bookings;
  readonly today: IsoDay;
  readonly plays: readonly Play[];
  readonly venues: readonly Venue[];
  readonly options: CriteriaOptions;
}

function durationsPhrase(play: Play): string {
  const { announcedDurations } = play;
  const [first] = announcedDurations;
  if (first === undefined) {
    return 'Durée non annoncée par le théâtre.';
  }
  if (announcedDurations.length === 1) {
    return `Durée annoncée : ${formatDuration(first.minutes)}.`;
  }
  const lead = announcedDurations.length === 2 ? 'Deux durées annoncées' : `${String(announcedDurations.length)} durées annoncées`;
  return `${lead} : ${announcedDurations.map((d) => `${formatDuration(d.minutes)} (${d.source.toLowerCase()})`).join(', ')}.`;
}

/**
 * Play page (« fiche » in the UI), with its selected performance. Routes: `/piece/:id` (performance preselected from the
 * criteria) and `/seances/:id` (a specific performance). Choosing another time updates the URL, so that a
 * reload shows the same performance. The bottom button books that exact performance (simulation).
 */
export function PlayPage({ journey, bookings, today, plays, venues, options }: Props) {
  const { criteria, playPageTarget } = journey;
  const playPage = playPageTarget === null ? undefined : resolvePlayPage(plays, venues, playPageTarget, criteria);

  return (
    <div className="flex h-dvh flex-col">
      <Navbar screen="play" date={dayLongLabel(criteria.day)} onHome={journey.returnToHome} onEveningPerformances={journey.goToEveningPerformances} bookingCount={bookings.count} onOpenTickets={bookings.openTickets} />
      {playPage === undefined ? (
        <PlayNotFound journey={journey} />
      ) : (
        // The key resets the day tab when switching to another play.
        <OpenPlay
          key={playPage.play.id}
          journey={journey}
          bookings={bookings}
          criteria={criteria}
          today={today}
          options={options}
          playPage={playPage}
        />
      )}
    </div>
  );
}

function PlayNotFound({ journey }: { readonly journey: Journey }) {
  const title = useRef<HTMLHeadingElement>(null);
  const shouldFocus = journey.hasNavigated;
  useEffect(() => {
    if (shouldFocus) {
      title.current?.focus({ preventScroll: true });
    }
  }, [shouldFocus]);
  const button = 'min-h-11 rounded-full border border-contour px-[18px] font-semibold hover:bg-surface-survol';
  return (
    <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col items-start gap-4 px-4 pt-8 tablette:px-6 bureau:px-8">
      <h1 ref={title} tabIndex={-1} className="font-editorial text-[40px] leading-none outline-none">
        Fiche introuvable
      </h1>
      <p className="text-texte-doux">Cette pièce ou cette séance n’existe pas, ou n’est plus programmée.</p>
      <div className="flex flex-wrap gap-2.5">
        <button type="button" onClick={journey.returnToHome} className={button}>
          Retour à l’accueil
        </button>
        <button type="button" onClick={journey.goToResults} className={button}>
          Voir les séances
        </button>
      </div>
    </main>
  );
}

interface OpenPlayProps {
  readonly journey: Journey;
  readonly bookings: Bookings;
  readonly criteria: OutingCriteria;
  readonly today: IsoDay;
  readonly options: CriteriaOptions;
  readonly playPage: NonNullable<ReturnType<typeof resolvePlayPage>>;
}

function OpenPlay({ journey, bookings, criteria, today, options, playPage }: OpenPlayProps) {
  const { play, venue, performance: selectedPerformance } = playPage;
  const title = useRef<HTMLHeadingElement>(null);
  const shouldFocus = journey.hasNavigated;
  const [chosenDay, setChosenDay] = useState<IsoDay | null>(null);

  // After a navigation (click on a poster or card, browser back), focus moves to the title.
  useEffect(() => {
    if (shouldFocus) {
      title.current?.focus({ preventScroll: true });
    }
  }, [shouldFocus]);

  const departurePointLabel = options.departurePoints.find((o) => o.id === criteria.departurePointId)?.label ?? criteria.departurePointId;
  const result = performanceResult(play, venue, selectedPerformance, criteria);
  const { group, status } = result.evaluation;
  const days = availableDays([play]);
  const shownDay = chosenDay !== null && days.includes(chosenDay) ? chosenDay : selectedPerformance.day;
  const performanceRows = play.performances
    .filter((s) => s.day === shownDay)
    .sort((a, b) => a.startMinutes - b.startMinutes)
    .map((s) => {
      const r = performanceResult(play, venue, s, criteria);
      return { id: r.id, performance: s, evaluation: r.evaluation };
    });
  const returnsToResults = journey.playPageSource === 'results';

  return (
    <>
      <main className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-4 px-4 pt-3 pb-7 tablette:px-6 tablette:pt-[18px] tablette:pb-9 bureau:px-8 bureau:pt-[22px] bureau:pb-10">
          <button
            type="button"
            aria-label={returnsToResults ? 'Retour aux résultats' : 'Retour à l’accueil'}
            onClick={journey.returnFromPlayPage}
            className="min-h-11 self-start rounded-full border border-filet py-0 pr-4 pl-3 text-sm font-semibold hover:bg-surface-survol"
          >
            <span aria-hidden="true">←</span> {returnsToResults ? 'Résultats' : 'Accueil'}
          </button>

          <div className="grid grid-cols-1 items-start gap-6 tablette:grid-cols-[260px_minmax(0,1fr)] tablette:gap-8 bureau:grid-cols-[300px_minmax(0,1fr)] bureau:gap-12">
            <div className="flex min-w-0 flex-col gap-[18px]">
              <div className="w-[180px] shadow-[0_18px_36px_oklch(0.08_0.02_285/0.6)] tablette:w-full">
                <Poster poster={play.poster} title={play.title} author={play.author} venueName={venue.name} />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold tracking-[0.14em] text-texte-doux uppercase">
                  {play.author} · {play.genres.map(genreLabel).join(', ')}
                </p>
                <h1
                  ref={title}
                  tabIndex={-1}
                  className="font-editorial text-[38px] leading-[0.98] font-normal text-pretty italic outline-none tablette:text-[40px] bureau:text-[54px]"
                >
                  {play.title}
                </h1>
                <p className="mt-1 text-base font-semibold">
                  {venue.name} · {venue.district}
                </p>
                <p className="text-sm text-texte-doux">{venue.address}</p>
                <p className="mt-1.5 max-w-[46ch] text-base leading-normal text-pretty">{play.synopsis}</p>
                <p className="text-sm text-texte-doux">{durationsPhrase(play)}</p>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex items-baseline justify-between gap-3 border-b-2 border-texte pb-2">
                <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase">Séances</h2>
                <p className="text-right text-[13px] text-texte-doux">
                  Depuis {departurePointLabel} à {formatTime(criteria.departureMinutes)} · sorti avant {formatTime(criteria.exitLimitMinutes)}
                </p>
              </div>
              <PerformancePicker
                days={days}
                shownDay={shownDay}
                today={today}
                performanceRows={performanceRows}
                selectedPerformanceId={buildPerformanceId(play, selectedPerformance)}
                onSelectDay={setChosenDay}
                onSelectPerformance={(id) => {
                  setChosenDay(null);
                  journey.selectPerformance(id);
                }}
              />
              <p
                aria-live="polite"
                className={`rounded-md border px-4 py-3.5 text-[15px] leading-snug text-pretty ${GROUP_TEXT[group]} ${GROUP_BORDER[group]}`}
              >
                {performanceVerdict(result, criteria, departurePointLabel)}
              </p>
              <TimingBreakdown result={result} criteria={criteria} departurePointLabel={departurePointLabel} />
            </div>
          </div>
        </div>
      </main>

      <div className="flex-none border-t border-filet bg-surface">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-x-5 gap-y-1 px-4 pt-2.5 pb-3.5 tablette:px-6 bureau:px-8">
          <p className="flex items-center gap-2 text-sm">
            <span aria-hidden="true" className={`size-2 flex-none rounded-full ${GROUP_DOT[group]}`} />
            <span className="font-bold">
              {dayBriefLabel(selectedPerformance.day)} · {formatTime(selectedPerformance.startMinutes)}
            </span>
            <span className={GROUP_TEXT[group]}>{STATUS_LABEL[status]}</span>
          </p>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => {
              bookings.openBookingForm(buildPerformanceId(play, selectedPerformance));
            }}
            className={`min-h-[54px] max-w-[420px] flex-[1_1_240px] rounded-full px-[22px] text-base font-extrabold ${
              group === 'feasible' ? 'bg-corail text-fond hover:bg-corail-vif' : 'border border-texte hover:bg-surface-survol'
            }`}
          >
            {bookActionLabel(group)}
          </button>
        </div>
      </div>
    </>
  );
}
