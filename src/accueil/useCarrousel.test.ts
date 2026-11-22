import { describe, expect, it } from 'vitest';

import { borner, etatFleches, indiceApresTouche, indiceDepuisDefilement, resoudreSelection, sensBalayage, SEUIL_BALAYAGE_PX, voisins } from './useCarrousel';

describe('état des flèches du carrousel (arrêt aux bords)', () => {
  it('première affiche : « précédente » inactive, « suivante » active', () => {
    expect(etatFleches(0, 7)).toEqual({ peutReculer: false, peutAvancer: true });
  });

  it('entre les deux : les deux actives', () => {
    expect(etatFleches(3, 7)).toEqual({ peutReculer: true, peutAvancer: true });
  });

  it('dernière affiche : « suivante » inactive, « précédente » active', () => {
    expect(etatFleches(6, 7)).toEqual({ peutReculer: true, peutAvancer: false });
  });

  it('une seule affiche, ou aucune : les deux inactives', () => {
    expect(etatFleches(0, 1)).toEqual({ peutReculer: false, peutAvancer: false });
    expect(etatFleches(0, 0)).toEqual({ peutReculer: false, peutAvancer: false });
  });
});

describe('affiches voisines de l’affiche active', () => {
  it('au milieu : deux de chaque côté, de gauche à droite', () => {
    expect(voisins(3, 7, 2)).toEqual({ avant: [1, 2], apres: [4, 5] });
  });

  it('première affiche : aucune voisine avant elle', () => {
    expect(voisins(0, 7, 2)).toEqual({ avant: [], apres: [1, 2] });
  });

  it('avant-dernière et dernière affiche : les voisines s’arrêtent au bord, sans repartir de zéro', () => {
    expect(voisins(5, 7, 2)).toEqual({ avant: [3, 4], apres: [6] });
    expect(voisins(6, 7, 2)).toEqual({ avant: [4, 5], apres: [] });
  });

  it('portée 1 : une voisine de chaque côté au plus', () => {
    expect(voisins(1, 7, 1)).toEqual({ avant: [0], apres: [2] });
  });
});

describe('navigation au clavier et au doigt', () => {
  it('← et → s’arrêtent aux bords, Début et Fin vont aux extrémités', () => {
    expect(indiceApresTouche('ArrowRight', 2, 7)).toBe(3);
    expect(indiceApresTouche('ArrowLeft', 0, 7)).toBe(0);
    expect(indiceApresTouche('ArrowRight', 6, 7)).toBe(6);
    expect(indiceApresTouche('Home', 4, 7)).toBe(0);
    expect(indiceApresTouche('End', 4, 7)).toBe(6);
  });

  it('une autre touche ne déplace rien (Tab, Entrée, Échap)', () => {
    for (const touche of ['Tab', 'Enter', ' ', 'Escape', 'a']) {
      expect(indiceApresTouche(touche, 2, 7)).toBeNull();
    }
  });

  it('un déplacement au-delà du seuil est un balayage : vers la gauche on avance, vers la droite on recule', () => {
    expect(sensBalayage(-(SEUIL_BALAYAGE_PX + 1))).toBe(1);
    expect(sensBalayage(SEUIL_BALAYAGE_PX + 1)).toBe(-1);
  });

  it('un déplacement court (toucher) n’est pas un balayage', () => {
    expect(sensBalayage(0)).toBe(0);
    expect(sensBalayage(SEUIL_BALAYAGE_PX)).toBe(0);
    expect(sensBalayage(-SEUIL_BALAYAGE_PX)).toBe(0);
  });

  it('borner garde un indice dans la liste', () => {
    expect(borner(-3, 7)).toBe(0);
    expect(borner(12, 7)).toBe(6);
    expect(borner(2, 0)).toBe(0);
  });
});

describe('sélection suivie depuis le défilement natif (moins de 1100 px)', () => {
  // Pas de 208 px : une affiche de 190 px et 18 px d'espace ; l'affiche i est centrée à i × pas.
  it('chaque affiche centrée donne son indice', () => {
    for (let i = 0; i < 7; i += 1) {
      expect(indiceDepuisDefilement(i * 208, 208, 7)).toBe(i);
    }
  });

  it('au fil du geste, la sélection change à la moitié du pas', () => {
    expect(indiceDepuisDefilement(103, 208, 7)).toBe(0);
    expect(indiceDepuisDefilement(105, 208, 7)).toBe(1);
    expect(indiceDepuisDefilement(94, 208, 7)).toBe(0);
  });

  it('un défilement élastique ou hors bornes reste dans la liste', () => {
    expect(indiceDepuisDefilement(-40, 208, 7)).toBe(0);
    expect(indiceDepuisDefilement(5000, 208, 7)).toBe(6);
  });

  it('sans pas mesurable (une seule affiche, mise en page absente) : première affiche', () => {
    expect(indiceDepuisDefilement(120, 0, 7)).toBe(0);
    expect(indiceDepuisDefilement(120, -1, 7)).toBe(0);
  });
});

describe('sélection suivie par identifiant de pièce', () => {
  const avant = ['misanthrope', 'vasseur', 'jeu', 'avare', 'cyrano', 'cle', 'huis-clos'];
  const dimanche = ['misanthrope', 'jeu', 'avare', 'cyrano'];

  it('la pièce choisie reste active quand elle change de position dans la liste (Jeu : 3e → 2e)', () => {
    expect(resoudreSelection(avant, 'jeu')).toEqual({ id: 'jeu', indice: 2 });
    // Avec l'ancien indice (2), la liste du dimanche aurait donné « avare » : c'est la régression à détecter.
    expect(resoudreSelection(dimanche, 'jeu')).toEqual({ id: 'jeu', indice: 1 });
    expect(resoudreSelection(dimanche, 'jeu').id).not.toBe(dimanche[2]);
  });

  it('une pièce qui disparaît de la liste est remplacée par la première pièce disponible', () => {
    expect(resoudreSelection(dimanche, 'cle')).toEqual({ id: 'misanthrope', indice: 0 });
    expect(resoudreSelection(dimanche, 'huis-clos')).toEqual({ id: 'misanthrope', indice: 0 });
  });

  it('sans choix préalable, première pièce de la liste', () => {
    expect(resoudreSelection(avant, null)).toEqual({ id: 'misanthrope', indice: 0 });
  });

  it('liste vide : aucune pièce active (état vide de l’accueil)', () => {
    expect(resoudreSelection([], 'jeu')).toEqual({ id: null, indice: 0 });
    expect(resoudreSelection([], null)).toEqual({ id: null, indice: 0 });
  });
});
