import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { Screen } from '../navigation/routes';
import { Navbar } from './Navbar';

const rendered = (screen: Screen, total = 0) =>
  renderToStaticMarkup(<Navbar screen={screen} date="Jeudi 26 novembre" onHome={() => undefined} onEveningPerformances={() => undefined} bookingCount={total} onOpenTickets={() => undefined} />);

describe('header and navigation', () => {
  it('offers the logo, « À l’affiche » and « Séances de la soirée » (« Séances » on mobile)', () => {
    const html = rendered('home');
    expect(html).toContain('aria-label="levee, accueil"');
    expect(html).toContain('À l’affiche');
    expect(html).toContain('Séances de la soirée');
    expect(html).toContain('<span class="tablette:hidden">Séances</span>');
  });

  it('shows the selected day’s date from 700 px up only', () => {
    expect(rendered('home')).toContain('hidden text-[13px] tracking-[0.12em] text-texte-doux uppercase tablette:inline">Jeudi 26 novembre');
  });

  it('« À l’affiche » is the current page on the home screen, and only there', () => {
    expect(rendered('home')).toContain('aria-current="page"');
    expect(rendered('results')).not.toContain('aria-current');
    expect(rendered('play')).not.toContain('aria-current');
  });

  it('« À l’affiche » is hidden on mobile, « Séances » stays visible', () => {
    const html = rendered('home');
    expect(html).toMatch(/href="\/"[^>]*class="[^"]*\bhidden\b[^"]*tablette:inline-flex[^"]*"[^>]*>À l’affiche/);
    expect(html).toMatch(/href="\/#seances-du-soir"[^>]*class="[^"]*\binline-flex\b/);
  });

  it('entries are real links (address, modified click) to the home screen and to the evening performances', () => {
    const html = rendered('play');
    expect(html.match(/href="\/"/g)).toHaveLength(2);
    expect(html).toContain('href="/#seances-du-soir"');
  });

  it('« Billets · N » on all screens, with the number of bookings', () => {
    for (const screen of ['home', 'results', 'play'] as const) {
      expect(rendered(screen, 0)).toContain('Billets · 0');
      expect(rendered(screen, 2)).toContain('Billets · 2');
    }
    expect(rendered('home', 1)).toMatch(/<button type="button" aria-haspopup="dialog"[^>]*>Billets/);
  });
});
