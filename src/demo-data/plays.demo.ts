import type { Play } from '../domain/types';

/*
 * FICTITIOUS DATA — demo.
 * The plays by Molière, Marivaux, Rostand and Sartre exist; the venues, schedules, durations
 * and the other titles are made up. Posters are graphic compositions, with no image.
 * A missing duration (empty array) is intentional: it shows the « unknown duration » case.
 */

const CREAM = 'oklch(0.95 0.03 90)';

export const DEMO_PLAYS: readonly Play[] = [
  {
    id: 'misanthrope',
    title: 'Le Misanthrope',
    author: 'Molière',
    synopsis: 'Alceste ne supporte ni la flatterie ni les politesses de salon. Il aime pourtant Célimène, qui en est la reine.',
    venueId: 'ambroise',
    genres: ['comedie', 'classique'],
    announcedDurations: [{ minutes: 110, source: 'Théâtre' }],
    fares: { full: 32, reduced: 18 },
    performances: [
      { day: '2026-11-26', startMinutes: 1200 },
      { day: '2026-11-27', startMinutes: 1200 },
      { day: '2026-11-28', startMinutes: 1170 },
      { day: '2026-11-29', startMinutes: 960 },
    ],
    poster: {
      background: 'oklch(0.36 0.08 160)',
      ink: CREAM,
      shapeA: { left: 40, top: 12, width: 84, ratio: 1, kind: 'round', color: CREAM },
      shapeB: { left: 12, top: 36, width: 20, ratio: 1, kind: 'round', color: 'oklch(0.66 0.19 35)' },
      title: { family: 'editorial', size: 17, italic: true, atTop: false },
    },
  },
  {
    id: 'vasseur',
    title: 'Un dîner chez les Vasseur',
    author: 'Claire Ormesson',
    synopsis: 'Un repas de famille, une annonce que personne n’attendait, et un dessert qui n’arrivera jamais.',
    venueId: 'faubourg',
    genres: ['comedie', 'contemporain'],
    announcedDurations: [],
    fares: { full: 26, reduced: 15 },
    performances: [
      { day: '2026-11-26', startMinutes: 1140 },
      { day: '2026-11-27', startMinutes: 1140 },
      { day: '2026-11-28', startMinutes: 1140 },
    ],
    poster: {
      background: 'oklch(0.82 0.14 88)',
      ink: 'oklch(0.22 0.03 60)',
      shapeA: { left: -10, top: 54, width: 120, ratio: 4.4, kind: 'rectangle', color: 'oklch(0.22 0.03 60)', rotation: -9 },
      shapeB: { left: 52, top: 41, width: 32, ratio: 1, kind: 'round', color: 'oklch(0.97 0.02 90)' },
      title: { family: 'grotesque', size: 12, italic: false, atTop: true },
    },
  },
  {
    id: 'jeu-amour-hasard',
    title: 'Le Jeu de l’amour et du hasard',
    author: 'Marivaux',
    synopsis: 'Silvia et Dorante échangent chacun leur place avec leur domestique pour observer l’autre. Aucun ne sait que l’autre a eu la même idée.',
    venueId: 'rotonde',
    genres: ['comedie', 'classique'],
    announcedDurations: [
      { minutes: 105, source: 'Site du théâtre' },
      { minutes: 115, source: 'Billetterie partenaire' },
    ],
    fares: { full: 29, reduced: 16 },
    performances: [
      { day: '2026-11-27', startMinutes: 1200 },
      { day: '2026-11-28', startMinutes: 990 },
      { day: '2026-11-28', startMinutes: 1200 },
      { day: '2026-11-29', startMinutes: 960 },
    ],
    poster: {
      background: 'oklch(0.76 0.11 12)',
      ink: 'oklch(0.27 0.08 350)',
      shapeA: { left: 8, top: 13, width: 52, ratio: 1, kind: 'round', color: 'oklch(0.27 0.08 350)' },
      shapeB: {
        left: 38,
        top: 21,
        width: 52,
        ratio: 1,
        kind: 'round',
        color: 'transparent',
        outline: { thickness: 2.4, color: 'oklch(0.97 0.02 90)' },
      },
      title: { family: 'editorial', size: 12.5, italic: true, atTop: false },
    },
  },
  {
    id: 'avare',
    title: 'L’Avare',
    author: 'Molière',
    synopsis: 'Harpagon veille sur sa cassette plus que sur ses enfants. Leurs projets de mariage vont contrarier les siens.',
    venueId: 'boulevards',
    genres: ['comedie', 'classique'],
    announcedDurations: [{ minutes: 90, source: 'Théâtre' }],
    fares: { full: 35, reduced: 20 },
    performances: [
      { day: '2026-11-26', startMinutes: 1200 },
      { day: '2026-11-27', startMinutes: 1230 },
      { day: '2026-11-28', startMinutes: 1125 },
      { day: '2026-11-29', startMinutes: 1020 },
    ],
    poster: {
      background: 'oklch(0.23 0.04 265)',
      ink: 'oklch(0.84 0.14 88)',
      shapeA: { left: 22, top: 19, width: 56, ratio: 1, kind: 'round', color: 'oklch(0.84 0.14 88)' },
      shapeB: { left: 22, top: 62, width: 56, ratio: 14, kind: 'rectangle', color: 'oklch(0.84 0.14 88)' },
      title: { family: 'grotesque', size: 19, italic: false, atTop: false },
    },
  },
  {
    id: 'cyrano',
    title: 'Cyrano de Bergerac',
    author: 'Edmond Rostand',
    synopsis: 'Cyrano prête ses mots à Christian pour séduire Roxane, qu’il aime en secret.',
    venueId: 'canal',
    genres: ['classique', 'comedie'],
    announcedDurations: [{ minutes: 165, source: 'Théâtre' }],
    fares: { full: 38, reduced: 22 },
    performances: [
      { day: '2026-11-26', startMinutes: 1170 },
      { day: '2026-11-28', startMinutes: 1200 },
      { day: '2026-11-29', startMinutes: 900 },
    ],
    poster: {
      background: 'oklch(0.6 0.19 33)',
      ink: CREAM,
      shapeA: { left: -20, top: 38, width: 140, ratio: 10, kind: 'rectangle', color: CREAM, rotation: -24 },
      shapeB: { left: 60, top: 11, width: 24, ratio: 1, kind: 'round', color: 'oklch(0.22 0.04 30)' },
      title: { family: 'grotesque', size: 14.5, italic: false, atTop: false },
    },
  },
  {
    id: 'cle-sous-la-porte',
    title: 'La Clé sous la porte',
    author: 'Jules Arnaud',
    synopsis: 'Trois colocataires, un bail qui se termine et un propriétaire qui sonne une heure trop tôt.',
    venueId: 'recollets',
    genres: ['comedie', 'contemporain'],
    announcedDurations: [{ minutes: 80, source: 'Théâtre' }],
    fares: { full: 24, reduced: 14 },
    performances: [
      { day: '2026-11-26', startMinutes: 1215 },
      { day: '2026-11-27', startMinutes: 1215 },
      { day: '2026-11-28', startMinutes: 1215 },
    ],
    poster: {
      background: 'oklch(0.48 0.13 255)',
      ink: CREAM,
      shapeA: { left: 30, top: 15, width: 40, ratio: 0.62, kind: 'rectangle', color: 'oklch(0.3 0.1 258)' },
      shapeB: { left: 59, top: 36, width: 6, ratio: 1, kind: 'round', color: 'oklch(0.86 0.15 92)' },
      title: { family: 'editorial', size: 15, italic: false, atTop: false },
    },
  },
  {
    id: 'huis-clos',
    title: 'Huis clos',
    author: 'Jean-Paul Sartre',
    synopsis: 'Trois inconnus enfermés dans un salon sans miroir découvrent pourquoi ils ont été réunis.',
    venueId: 'recollets',
    genres: ['drame', 'contemporain'],
    announcedDurations: [{ minutes: 90, source: 'Théâtre' }],
    fares: { full: 24, reduced: 14 },
    performances: [
      { day: '2026-11-26', startMinutes: 1155 },
      { day: '2026-11-28', startMinutes: 1095 },
    ],
    poster: {
      background: 'oklch(0.9 0.012 85)',
      ink: 'oklch(0.2 0.02 285)',
      shapeA: { left: 18, top: 17, width: 64, ratio: 1, kind: 'rectangle', color: 'oklch(0.2 0.02 285)' },
      shapeB: { left: 62, top: 45, width: 12, ratio: 1, kind: 'rectangle', color: 'oklch(0.6 0.2 28)' },
      title: { family: 'grotesque', size: 19, italic: false, atTop: false },
    },
  },
];
