import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CarteSeance } from './CarteSeance';
import { DEUX_DUREES, resultatPour, type Cas } from '../domaine/fixtures.test-utils';

/** Le texte tel qu'il est rendu dans la carte (rendu serveur, sans navigateur). */
function carte(cas: Cas): string {
  const { resultat, criteres } = resultatPour(cas);
  return renderToStaticMarkup(<CarteSeance resultat={resultat} criteres={criteres} origineLibelle="République" onOuvrir={() => undefined} />);
}

const SANS_TRAJET = 'Aucun trajet n’est estimé depuis République : l’heure d’arrivée ne peut pas être calculée.';
const REF: Cas = { durees: DEUX_DUREES, debutMinutes: 1200, limiteMinutes: 1310, avecTrajet: false };

describe('carte « Trajet non estimé » : texte réellement affiché', () => {
  it('avec une fin incertaine, la carte affiche le statut, la plage de fin et la phrase complète', () => {
    const html = carte(REF);
    expect(html).toContain('Trajet non estimé');
    expect(html).toContain('trajet non estimé');
    expect(html).toContain('21h45–21h55');
    expect(html).toContain(
      `${SANS_TRAJET} Deux durées sont annoncées : 1 h 45 et 1 h 55. La séance peut finir entre 21h45 et 21h55. Votre limite est 21h50.`,
    );
  });

  it('avec une durée inconnue, la carte affiche les deux manques', () => {
    const html = carte({ ...REF, durees: [] });
    expect(html).toContain('Trajet non estimé');
    expect(html).toContain('annoncé · durée non annoncée');
    expect(html).toContain('non calculable');
    expect(html).toContain(`${SANS_TRAJET} Durée non annoncée : la fin ne peut pas être calculée.`);
  });

  it('avec une fin exactement à la limite, la carte ne parle que du trajet et indique « pile à votre limite »', () => {
    const html = carte({ durees: [{ minutes: 110, source: 'Théâtre' }], debutMinutes: 1170, limiteMinutes: 1280, avecTrajet: false });
    expect(html).toContain('Trajet non estimé');
    expect(html).toContain('calculée · pile à votre limite');
    expect(html).toContain(`>${SANS_TRAJET}</p>`);
  });

  it('avec une fin certainement trop tardive, la carte est « Finit après votre limite »', () => {
    const html = carte({ durees: [{ minutes: 165, source: 'Théâtre' }], debutMinutes: 1200, limiteMinutes: 1320, avecTrajet: false });
    expect(html).toContain('Finit après votre limite');
    expect(html).not.toContain('Trajet non estimé</p>');
  });

  it('une séance « Fin incertaine » avec trajet affiche la nouvelle phrase', () => {
    expect(carte({ ...REF, avecTrajet: true })).toContain(
      'Deux durées sont annoncées : 1 h 45 et 1 h 55. La séance peut finir entre 21h45 et 21h55. Votre limite est 21h50.',
    );
  });
});

describe('carte : lien vers la fiche de cette séance', () => {
  it('le titre est un lien vers /seances/:identifiant exact, étendu à la carte, avec l’heure dans son nom', () => {
    const { resultat, criteres } = resultatPour({ durees: DEUX_DUREES, debutMinutes: 1200, limiteMinutes: 1320, avecTrajet: true });
    const html = renderToStaticMarkup(<CarteSeance resultat={resultat} criteres={criteres} origineLibelle="République" onOuvrir={() => undefined} />);
    expect(html).toContain(`href="/seances/x-2026-11-28-1200"`);
    expect(html).toContain(`data-cle="x-2026-11-28-1200"`);
    expect(html).toContain('séance de 20h00');
    expect(html).toContain('after:absolute after:inset-0');
  });
});
