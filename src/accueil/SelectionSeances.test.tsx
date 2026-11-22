import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { DEMO_CRITERES_INITIAUX } from '../donnees-demo/criteres.demo';
import { DEMO_SALLES } from '../donnees-demo/salles.demo';
import { DEMO_SPECTACLES } from '../donnees-demo/spectacles.demo';
import { construireResultats } from '../domaine/resultats';
import type { CriteresSortie, Spectacle } from '../domaine/types';
import { selectionSoiree } from './selection';
import { SelectionSeances } from './SelectionSeances';

function rendu(surcharge: Partial<CriteresSortie> = {}, spectacles: readonly Spectacle[] = DEMO_SPECTACLES): string {
  const criteres: CriteresSortie = { ...DEMO_CRITERES_INITIAUX, ...surcharge };
  const resultats = construireResultats(spectacles, DEMO_SALLES, criteres);
  return renderToStaticMarkup(
    <SelectionSeances
      selection={selectionSoiree(resultats)}
      resultats={resultats}
      criteres={criteres}
      origineLibelle="République"
      onOuvrir={() => undefined}
      onTous={() => undefined}
      onModifier={() => undefined}
      refSection={null}
      refTitre={null}
    />,
  );
}

describe('sélection de séances sous l’accueil : rendu réel', () => {
  it('trois cartes, chacune un lien vers l’identifiant exact de sa séance', () => {
    const html = rendu();
    expect(html.match(/<li>/g)).toHaveLength(3);
    for (const id of ['huis-clos-2026-11-26-1155', 'avare-2026-11-26-1200', 'misanthrope-2026-11-26-1200']) {
      expect(html).toContain(`href="/seances/${id}"`);
      expect(html).toContain(`data-cle="${id}"`);
    }
  });

  it('une pièce jouée deux fois le même jour : deux cartes, chacune avec l’identifiant de sa représentation', () => {
    const jeu = DEMO_SPECTACLES.filter((s) => s.id === 'jeu-amour-hasard');
    const html = rendu({ jour: '2026-11-28', departMinutes: 960 }, jeu);
    expect(html.match(/<li>/g)).toHaveLength(2);
    expect(html).toContain('href="/seances/jeu-amour-hasard-2026-11-28-990"');
    expect(html).toContain('href="/seances/jeu-amour-hasard-2026-11-28-1200"');
  });

  it('état vide : message dédié, aucune carte, et les deux actions restent proposées', () => {
    const html = rendu({ departMinutes: 1260, limiteMinutes: 1200 });
    expect(html).toContain('Aucune séance ne rentre dans cette soirée.');
    expect(html).not.toContain('<li>');
    expect(html).toContain('Modifier mes critères');
    expect(html).toContain('href="/seances"');
  });

  it('« Voir tous les résultats » mène à la liste complète, et le titre porte l’ancre de la sélection', () => {
    const html = rendu();
    expect(html).toMatch(/<a[^>]*href="\/seances"[^>]*>Voir tous les résultats/);
    expect(html).toContain('id="seances-du-soir"');
  });

  it('rappelle les compteurs de tous les résultats, pas seulement ceux de la sélection', () => {
    expect(rendu()).toContain('4 possibles · 1 à vérifier · 1 impossible · depuis République à 18h30, sorti avant 22h00');
  });
});
