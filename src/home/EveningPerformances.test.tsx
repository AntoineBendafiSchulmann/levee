import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { DEMO_INITIAL_CRITERIA } from '../demo-data/criteria.demo';
import { DEMO_VENUES } from '../demo-data/venues.demo';
import { DEMO_PLAYS } from '../demo-data/plays.demo';
import { buildResults } from '../domain/results';
import type { OutingCriteria, Play } from '../domain/types';
import { selectEveningPerformances } from './selectEveningPerformances';
import { EveningPerformances } from './EveningPerformances';

function rendered(overrides: Partial<OutingCriteria> = {}, plays: readonly Play[] = DEMO_PLAYS): string {
  const criteria: OutingCriteria = { ...DEMO_INITIAL_CRITERIA, ...overrides };
  const results = buildResults(plays, DEMO_VENUES, criteria);
  return renderToStaticMarkup(
    <EveningPerformances
      performances={selectEveningPerformances(results)}
      results={results}
      criteria={criteria}
      departurePointLabel="République"
      onOpen={() => undefined}
      onViewAll={() => undefined}
      onEdit={() => undefined}
      sectionRef={null}
      titleRef={null}
    />,
  );
}

describe('evening performances under the home page: real rendering', () => {
  it('three cards, each linking to the exact identifier of its performance', () => {
    const html = rendered();
    expect(html.match(/<li>/g)).toHaveLength(3);
    for (const id of ['huis-clos-2026-11-26-1155', 'avare-2026-11-26-1200', 'misanthrope-2026-11-26-1200']) {
      expect(html).toContain(`href="/seances/${id}"`);
      expect(html).toContain(`data-focus-key="${id}"`);
    }
  });

  it('a play performed twice on the same day: two cards, each with its performance identifier', () => {
    const loveAndChance = DEMO_PLAYS.filter((s) => s.id === 'jeu-amour-hasard');
    const html = rendered({ day: '2026-11-28', departureMinutes: 960 }, loveAndChance);
    expect(html.match(/<li>/g)).toHaveLength(2);
    expect(html).toContain('href="/seances/jeu-amour-hasard-2026-11-28-990"');
    expect(html).toContain('href="/seances/jeu-amour-hasard-2026-11-28-1200"');
  });

  it('empty state: dedicated message, no card, and both actions remain offered', () => {
    const html = rendered({ departureMinutes: 1260, exitLimitMinutes: 1200 });
    expect(html).toContain('Aucune séance ne rentre dans cette soirée.');
    expect(html).not.toContain('<li>');
    expect(html).toContain('Modifier mes critères');
    expect(html).toContain('href="/seances"');
  });

  it('« Voir tous les résultats » leads to the full list, and the heading carries the evening performances anchor', () => {
    const html = rendered();
    expect(html).toMatch(/<a[^>]*href="\/seances"[^>]*>Voir tous les résultats/);
    expect(html).toContain('id="seances-du-soir"');
  });

  it('recalls the counters of all results, not only those of the evening performances', () => {
    expect(rendered()).toContain('4 possibles · 1 à vérifier · 1 impossible · depuis République à 18h30, sorti avant 22h00');
  });
});
