import { describe, expect, it } from 'vitest';

import { estEntierementVisible, etatFleches } from './useCarrousel';

// Défileur de 826 px de large contenant 1908 px : premier arrêt à 0, dernier à 1082.
const LARGEUR = 826;
const TOTAL = 1908;
const DERNIER = TOTAL - LARGEUR;

describe('état des flèches du carrousel', () => {
  it('premier arrêt : « précédente » inactive, « suivante » active', () => {
    expect(etatFleches(0, TOTAL, LARGEUR)).toEqual({ peutReculer: false, peutAvancer: true });
  });

  it('entre les deux arrêts : les deux actives', () => {
    expect(etatFleches(318, TOTAL, LARGEUR)).toEqual({ peutReculer: true, peutAvancer: true });
    expect(etatFleches(DERNIER - 3, TOTAL, LARGEUR)).toEqual({ peutReculer: true, peutAvancer: true });
  });

  it('dernier arrêt : « suivante » inactive, « précédente » active', () => {
    expect(etatFleches(DERNIER, TOTAL, LARGEUR)).toEqual({ peutReculer: true, peutAvancer: false });
  });

  it('tolère les positions fractionnaires aux bords (zoom, accroche)', () => {
    expect(etatFleches(0.6, TOTAL, LARGEUR).peutReculer).toBe(false);
    expect(etatFleches(DERNIER - 0.6, TOTAL, LARGEUR).peutAvancer).toBe(false);
  });

  it('rien à défiler : les deux inactives, quelle que soit la position lue', () => {
    expect(etatFleches(0, 800, 800)).toEqual({ peutReculer: false, peutAvancer: false });
    expect(etatFleches(0, 801, 800)).toEqual({ peutReculer: false, peutAvancer: false });
    expect(etatFleches(5, 600, 800)).toEqual({ peutReculer: false, peutAvancer: false });
  });
});

describe('affiche entièrement visible ou non', () => {
  it('centrée, ou simplement dans la zone : visible', () => {
    expect(estEntierementVisible(1090, 200, 1090 - 95, 390)).toBe(true);
    expect(estEntierementVisible(100, 200, 0, 390)).toBe(true);
  });

  it('au ras des deux bords : visible', () => {
    expect(estEntierementVisible(0, 200, 0, 390)).toBe(true);
    expect(estEntierementVisible(190, 200, 0, 390)).toBe(true);
  });

  it('rognée à gauche ou à droite : pas entièrement visible', () => {
    expect(estEntierementVisible(100, 200, 160, 390)).toBe(false);
    expect(estEntierementVisible(300, 200, 0, 390)).toBe(false);
  });

  it('hors de vue (après une actualisation qui remet le défilement à 0) : pas visible', () => {
    expect(estEntierementVisible(1185, 200, 0, 390)).toBe(false);
  });
});
