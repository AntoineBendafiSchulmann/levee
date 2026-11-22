import type { Spectacle } from '../domaine/types';

/*
 * DONNÉES FICTIVES — démonstration du lot 1.
 * Les pièces de Molière, Marivaux, Rostand et Sartre existent ; les salles, les horaires
 * et les autres titres sont inventés. Les affiches sont des compositions graphiques, sans image.
 */

const CREME = 'oklch(0.95 0.03 90)';

export const DEMO_SPECTACLES: readonly Spectacle[] = [
  {
    id: 'misanthrope',
    titre: 'Le Misanthrope',
    auteur: 'Molière',
    salleId: 'ambroise',
    seances: [
      { jour: '2026-11-26', debutMinutes: 1200 },
      { jour: '2026-11-27', debutMinutes: 1200 },
      { jour: '2026-11-28', debutMinutes: 1170 },
      { jour: '2026-11-29', debutMinutes: 960 },
    ],
    affiche: {
      fond: 'oklch(0.36 0.08 160)',
      encre: CREME,
      formeA: { gauche: 40, haut: 12, largeur: 84, ratio: 1, forme: 'rond', couleur: CREME },
      formeB: { gauche: 12, haut: 36, largeur: 20, ratio: 1, forme: 'rond', couleur: 'oklch(0.66 0.19 35)' },
      titre: { famille: 'editorial', taille: 17, italique: true, enHaut: false },
    },
  },
  {
    id: 'vasseur',
    titre: 'Un dîner chez les Vasseur',
    auteur: 'Claire Ormesson',
    salleId: 'faubourg',
    seances: [
      { jour: '2026-11-26', debutMinutes: 1140 },
      { jour: '2026-11-27', debutMinutes: 1140 },
      { jour: '2026-11-28', debutMinutes: 1140 },
    ],
    affiche: {
      fond: 'oklch(0.82 0.14 88)',
      encre: 'oklch(0.22 0.03 60)',
      formeA: { gauche: -10, haut: 54, largeur: 120, ratio: 4.4, forme: 'rectangle', couleur: 'oklch(0.22 0.03 60)', rotation: -9 },
      formeB: { gauche: 52, haut: 41, largeur: 32, ratio: 1, forme: 'rond', couleur: 'oklch(0.97 0.02 90)' },
      titre: { famille: 'grotesque', taille: 12, italique: false, enHaut: true },
    },
  },
  {
    id: 'jeu-amour-hasard',
    titre: 'Le Jeu de l’amour et du hasard',
    auteur: 'Marivaux',
    salleId: 'rotonde',
    seances: [
      { jour: '2026-11-27', debutMinutes: 1200 },
      { jour: '2026-11-28', debutMinutes: 990 },
      { jour: '2026-11-28', debutMinutes: 1200 },
      { jour: '2026-11-29', debutMinutes: 960 },
    ],
    affiche: {
      fond: 'oklch(0.76 0.11 12)',
      encre: 'oklch(0.27 0.08 350)',
      formeA: { gauche: 8, haut: 13, largeur: 52, ratio: 1, forme: 'rond', couleur: 'oklch(0.27 0.08 350)' },
      formeB: {
        gauche: 38,
        haut: 21,
        largeur: 52,
        ratio: 1,
        forme: 'rond',
        couleur: 'transparent',
        contour: { epaisseur: 2.4, couleur: 'oklch(0.97 0.02 90)' },
      },
      titre: { famille: 'editorial', taille: 12.5, italique: true, enHaut: false },
    },
  },
  {
    id: 'avare',
    titre: 'L’Avare',
    auteur: 'Molière',
    salleId: 'boulevards',
    seances: [
      { jour: '2026-11-26', debutMinutes: 1200 },
      { jour: '2026-11-27', debutMinutes: 1230 },
      { jour: '2026-11-28', debutMinutes: 1125 },
      { jour: '2026-11-29', debutMinutes: 1020 },
    ],
    affiche: {
      fond: 'oklch(0.23 0.04 265)',
      encre: 'oklch(0.84 0.14 88)',
      formeA: { gauche: 22, haut: 19, largeur: 56, ratio: 1, forme: 'rond', couleur: 'oklch(0.84 0.14 88)' },
      formeB: { gauche: 22, haut: 62, largeur: 56, ratio: 14, forme: 'rectangle', couleur: 'oklch(0.84 0.14 88)' },
      titre: { famille: 'grotesque', taille: 19, italique: false, enHaut: false },
    },
  },
  {
    id: 'cyrano',
    titre: 'Cyrano de Bergerac',
    auteur: 'Edmond Rostand',
    salleId: 'canal',
    seances: [
      { jour: '2026-11-26', debutMinutes: 1170 },
      { jour: '2026-11-28', debutMinutes: 1200 },
      { jour: '2026-11-29', debutMinutes: 900 },
    ],
    affiche: {
      fond: 'oklch(0.6 0.19 33)',
      encre: CREME,
      formeA: { gauche: -20, haut: 38, largeur: 140, ratio: 10, forme: 'rectangle', couleur: CREME, rotation: -24 },
      formeB: { gauche: 60, haut: 11, largeur: 24, ratio: 1, forme: 'rond', couleur: 'oklch(0.22 0.04 30)' },
      titre: { famille: 'grotesque', taille: 14.5, italique: false, enHaut: false },
    },
  },
  {
    id: 'cle-sous-la-porte',
    titre: 'La Clé sous la porte',
    auteur: 'Jules Arnaud',
    salleId: 'recollets',
    seances: [
      { jour: '2026-11-26', debutMinutes: 1215 },
      { jour: '2026-11-27', debutMinutes: 1215 },
      { jour: '2026-11-28', debutMinutes: 1215 },
    ],
    affiche: {
      fond: 'oklch(0.48 0.13 255)',
      encre: CREME,
      formeA: { gauche: 30, haut: 15, largeur: 40, ratio: 0.62, forme: 'rectangle', couleur: 'oklch(0.3 0.1 258)' },
      formeB: { gauche: 59, haut: 36, largeur: 6, ratio: 1, forme: 'rond', couleur: 'oklch(0.86 0.15 92)' },
      titre: { famille: 'editorial', taille: 15, italique: false, enHaut: false },
    },
  },
  {
    id: 'huis-clos',
    titre: 'Huis clos',
    auteur: 'Jean-Paul Sartre',
    salleId: 'recollets',
    seances: [
      { jour: '2026-11-26', debutMinutes: 1155 },
      { jour: '2026-11-28', debutMinutes: 1095 },
    ],
    affiche: {
      fond: 'oklch(0.9 0.012 85)',
      encre: 'oklch(0.2 0.02 285)',
      formeA: { gauche: 18, haut: 17, largeur: 64, ratio: 1, forme: 'rectangle', couleur: 'oklch(0.2 0.02 285)' },
      formeB: { gauche: 62, haut: 45, largeur: 12, ratio: 1, forme: 'rectangle', couleur: 'oklch(0.6 0.2 28)' },
      titre: { famille: 'grotesque', taille: 19, italique: false, enHaut: false },
    },
  },
];
