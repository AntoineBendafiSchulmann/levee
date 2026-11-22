import type { MouseEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { estClicSimple, surClicSimple } from './lien';

function clic(surcharge: Partial<Pick<MouseEvent, 'button' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>> = {}) {
  const preventDefault = vi.fn();
  const evenement = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, preventDefault, ...surcharge };
  return { evenement: evenement as unknown as MouseEvent, preventDefault };
}

describe('clic simple sur un lien interne', () => {
  it('un clic simple annule la navigation du navigateur et déclenche l’action', () => {
    const agir = vi.fn();
    const { evenement, preventDefault } = clic();
    surClicSimple(agir)(evenement);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(agir).toHaveBeenCalledTimes(1);
  });

  it('un clic modifié suit le lien : nouvel onglet (Ctrl, Cmd), nouvelle fenêtre (Maj), téléchargement (Alt), bouton du milieu', () => {
    for (const surcharge of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      const agir = vi.fn();
      const { evenement, preventDefault } = clic(surcharge);
      expect(estClicSimple(evenement)).toBe(false);
      surClicSimple(agir)(evenement);
      expect(preventDefault).not.toHaveBeenCalled();
      expect(agir).not.toHaveBeenCalled();
    }
  });

  it('l’action reçoit l’évènement : l’activation au clavier (detail 0) peut ainsi se distinguer d’un clic souris', () => {
    const recus: unknown[] = [];
    const { evenement } = clic();
    surClicSimple((e) => recus.push(e))(evenement);
    expect(recus).toEqual([evenement]);
  });
});
