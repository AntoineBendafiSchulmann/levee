import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PerformanceCard } from './PerformanceCard';
import { TWO_DURATIONS, resultFor, type Scenario } from '../domain/fixtures.test-utils';

/** The text as rendered in the card (server rendering, no browser). */
function card(scenario: Scenario): string {
  const { result, criteria } = resultFor(scenario);
  return renderToStaticMarkup(<PerformanceCard result={result} criteria={criteria} departurePointLabel="République" onOpen={() => undefined} />);
}

const NO_TRAVEL_ESTIMATE = 'Aucun trajet n’est estimé depuis République : l’heure d’arrivée ne peut pas être calculée.';
const REF: Scenario = { announcedDurations: TWO_DURATIONS, startMinutes: 1200, exitLimitMinutes: 1310, withTravelEstimate: false };

describe('« Trajet non estimé » card: text actually displayed', () => {
  it('with an uncertain end, the card shows the status, the end range and the full sentence', () => {
    const html = card(REF);
    expect(html).toContain('Trajet non estimé');
    expect(html).toContain('trajet non estimé');
    expect(html).toContain('21h45–21h55');
    expect(html).toContain(
      `${NO_TRAVEL_ESTIMATE} Deux durées sont annoncées : 1 h 45 et 1 h 55. La séance peut finir entre 21h45 et 21h55. Votre limite est 21h50.`,
    );
  });

  it('with an unknown duration, the card shows both gaps', () => {
    const html = card({ ...REF, announcedDurations: [] });
    expect(html).toContain('Trajet non estimé');
    expect(html).toContain('annoncé · durée non annoncée');
    expect(html).toContain('non calculable');
    expect(html).toContain(`${NO_TRAVEL_ESTIMATE} Durée non annoncée : la fin ne peut pas être calculée.`);
  });

  it('with an end exactly at the limit, the card only mentions the travel and says « pile à votre limite »', () => {
    const html = card({ announcedDurations: [{ minutes: 110, source: 'Théâtre' }], startMinutes: 1170, exitLimitMinutes: 1280, withTravelEstimate: false });
    expect(html).toContain('Trajet non estimé');
    expect(html).toContain('calculée · pile à votre limite');
    expect(html).toContain(`>${NO_TRAVEL_ESTIMATE}</p>`);
  });

  it('with an end certainly too late, the card is « Finit après votre limite »', () => {
    const html = card({ announcedDurations: [{ minutes: 165, source: 'Théâtre' }], startMinutes: 1200, exitLimitMinutes: 1320, withTravelEstimate: false });
    expect(html).toContain('Finit après votre limite');
    expect(html).not.toContain('Trajet non estimé</p>');
  });

  it('a « Fin incertaine » performance with travel shows the new sentence', () => {
    expect(card({ ...REF, withTravelEstimate: true })).toContain(
      'Deux durées sont annoncées : 1 h 45 et 1 h 55. La séance peut finir entre 21h45 et 21h55. Votre limite est 21h50.',
    );
  });
});

describe('card: link to this performance’s page', () => {
  it('the title is a link to the exact /seances/:identifiant, stretched over the card, with the time in its name', () => {
    const { result, criteria } = resultFor({ announcedDurations: TWO_DURATIONS, startMinutes: 1200, exitLimitMinutes: 1320, withTravelEstimate: true });
    const html = renderToStaticMarkup(<PerformanceCard result={result} criteria={criteria} departurePointLabel="République" onOpen={() => undefined} />);
    expect(html).toContain(`href="/seances/x-2026-11-28-1200"`);
    expect(html).toContain(`data-focus-key="x-2026-11-28-1200"`);
    expect(html).toContain('séance de 20h00');
    expect(html).toContain('after:absolute after:inset-0');
  });
});
