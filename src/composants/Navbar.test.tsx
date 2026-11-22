import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { Ecran } from '../parcours/chemins';
import { Navbar } from './Navbar';

const rendu = (ecran: Ecran, nombre = 0) =>
  renderToStaticMarkup(<Navbar ecran={ecran} date="Jeudi 26 novembre" onAccueil={() => undefined} onSeances={() => undefined} bookingCount={nombre} onOpenTickets={() => undefined} />);

describe('en-tête et navigation', () => {
  it('propose le logo, « À l’affiche » et « Séances de la soirée » (« Séances » sur mobile)', () => {
    const html = rendu('accueil');
    expect(html).toContain('aria-label="levee, accueil"');
    expect(html).toContain('À l’affiche');
    expect(html).toContain('Séances de la soirée');
    expect(html).toContain('<span class="tablette:hidden">Séances</span>');
  });

  it('affiche la date du jour sélectionné à partir de 700 px seulement', () => {
    expect(rendu('accueil')).toContain('hidden text-[13px] tracking-[0.12em] text-texte-doux uppercase tablette:inline">Jeudi 26 novembre');
  });

  it('« À l’affiche » est la page courante sur l’accueil, et seulement là', () => {
    expect(rendu('accueil')).toContain('aria-current="page"');
    expect(rendu('resultats')).not.toContain('aria-current');
    expect(rendu('piece')).not.toContain('aria-current');
  });

  it('« À l’affiche » est masqué sur mobile, « Séances » reste visible', () => {
    const html = rendu('accueil');
    expect(html).toMatch(/href="\/"[^>]*class="[^"]*\bhidden\b[^"]*tablette:inline-flex[^"]*"[^>]*>À l’affiche/);
    expect(html).toMatch(/href="\/#seances-du-soir"[^>]*class="[^"]*\binline-flex\b/);
  });

  it('les entrées sont de vrais liens (adresse, clic modifié) vers l’accueil et vers les séances du soir', () => {
    const html = rendu('piece');
    expect(html.match(/href="\/"/g)).toHaveLength(2);
    expect(html).toContain('href="/#seances-du-soir"');
  });

  it('« Billets · N » sur tous les écrans, avec le nombre de réservations', () => {
    for (const ecran of ['accueil', 'resultats', 'piece'] as const) {
      expect(rendu(ecran, 0)).toContain('Billets · 0');
      expect(rendu(ecran, 2)).toContain('Billets · 2');
    }
    expect(rendu('accueil', 1)).toMatch(/<button type="button" aria-haspopup="dialog"[^>]*>Billets/);
  });
});
