import { HomePage } from './home/HomePage';
import { BookingSheet } from './bookings/BookingSheet';
import { useBookings } from './bookings/useBookings';
import { PlayPage } from './play/PlayPage';
import type { CriteriaOptions } from './criteria/CriteriaForm';
import { buildResults } from './domain/results';
import { availableDays } from './domain/schedule';
import { DEMO_TODAY, DEMO_SUGGESTED_AUTHORS, DEMO_INITIAL_CRITERIA } from './demo-data/criteria.demo';
import { DEMO_DEPARTURE_POINTS } from './demo-data/departurePoints.demo';
import { DEMO_VENUES } from './demo-data/venues.demo';
import { DEMO_PLAYS } from './demo-data/plays.demo';
import { useJourney } from './navigation/useJourney';
import { ResultsPage } from './results/ResultsPage';

const OPTIONS: CriteriaOptions = {
  today: DEMO_TODAY,
  days: availableDays(DEMO_PLAYS),
  departurePoints: DEMO_DEPARTURE_POINTS,
  suggestedAuthors: DEMO_SUGGESTED_AUTHORS,
};

/**
 * Composition root: the only place that imports the demo data and holds the state of the journey and of the
 * simulated bookings (the bookings sheet is mounted here, once). The home page counters, the criteria sheet and
 * the results all come from the same computation, hence the same numbers. Wiring up the BFF will replace these
 * imports without touching the components.
 */
export function App() {
  const journey = useJourney(DEMO_INITIAL_CRITERIA, OPTIONS);
  const bookings = useBookings(DEMO_PLAYS);
  const results = buildResults(DEMO_PLAYS, DEMO_VENUES, journey.criteria);
  const departurePointLabel = OPTIONS.departurePoints.find((o) => o.id === journey.criteria.departurePointId)?.label ?? journey.criteria.departurePointId;

  const screen =
    journey.screen === 'play' ? (
      <PlayPage
        journey={journey}
        bookings={bookings}
        today={DEMO_TODAY}
        plays={DEMO_PLAYS}
        venues={DEMO_VENUES}
        options={OPTIONS}
      />
    ) : journey.screen === 'results' ? (
      <ResultsPage journey={journey} bookings={bookings} today={DEMO_TODAY} options={OPTIONS} results={results} />
    ) : (
      <HomePage
        journey={journey}
        bookings={bookings}
        today={DEMO_TODAY}
        plays={DEMO_PLAYS}
        venues={DEMO_VENUES}
        options={OPTIONS}
        results={results}
      />
    );

  return (
    <>
      {screen}
      <BookingSheet
        bookings={bookings}
        plays={DEMO_PLAYS}
        venues={DEMO_VENUES}
        criteria={journey.criteria}
        departurePointLabel={departurePointLabel}
        source={journey.playPageSource}
        onBack={journey.returnFromPlayPage}
      />
    </>
  );
}
