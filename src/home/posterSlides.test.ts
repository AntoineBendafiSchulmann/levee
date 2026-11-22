import { describe, expect, it } from 'vitest';

import { DEMO_TODAY, DEMO_INITIAL_CRITERIA } from '../demo-data/criteria.demo';
import { DEMO_VENUES } from '../demo-data/venues.demo';
import { DEMO_PLAYS } from '../demo-data/plays.demo';
import { suggestPerformance, buildPerformanceId, resolvePlayPage, findVenue } from '../domain/performances';
import { formatTime, dayShortLabel } from '../domain/time';
import type { OutingCriteria } from '../domain/types';
import { buildSlides } from './posterSlides';

const criteria = (overrides: Partial<OutingCriteria> = {}): OutingCriteria => ({ ...DEMO_INITIAL_CRITERIA, ...overrides });
const slides = (overrides: Partial<OutingCriteria> = {}) =>
  buildSlides(DEMO_PLAYS, DEMO_VENUES, criteria(overrides), DEMO_TODAY);
const jeu = (overrides: Partial<OutingCriteria> = {}) => {
  const found = slides(overrides).find((d) => d.id === 'jeu-amour-hasard');
  if (found === undefined) {
    throw new Error('Poster slide of the Jeu play not found.');
  }
  return found;
};

describe('home posters', () => {
  it('Saturday 28: the Jeu caption announces 16h30 from 16h00 and 20h00 from 18h30', () => {
    expect(jeu({ day: '2026-11-28', departureMinutes: 960 }).caption).toBe('Sam. 28 · 16h30');
    expect(jeu({ day: '2026-11-28', departureMinutes: 1110 }).caption).toBe('Sam. 28 · 20h00');
  });

  it('each poster caption is the time the detail page preselects, for all days and departures', () => {
    for (const day of ['2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29']) {
      for (const departureMinutes of [840, 960, 1110, 1260]) {
        const c = criteria({ day, departureMinutes });
        for (const slide of buildSlides(DEMO_PLAYS, DEMO_VENUES, c, DEMO_TODAY)) {
          const playPage = resolvePlayPage(DEMO_PLAYS, DEMO_VENUES, { type: 'play', id: slide.id }, c);
          expect(playPage).toBeDefined();
          expect(slide.caption).toBe(
            `${dayShortLabel(playPage?.performance.day ?? '', DEMO_TODAY)} · ${formatTime(playPage?.performance.startMinutes ?? 0)}`,
          );
        }
      }
    }
  });

  it('the performances offered under the poster carry the exact identifier and mark the « Séance proposée »', () => {
    const { performances } = jeu({ day: '2026-11-28', departureMinutes: 1110 });
    expect(performances.map((s) => [s.id, s.timeLabel, s.isSuggested])).toEqual([
      ['jeu-amour-hasard-2026-11-28-990', '16h30', false],
      ['jeu-amour-hasard-2026-11-28-1200', '20h00', true],
    ]);
    const play = DEMO_PLAYS.find((s) => s.id === 'jeu-amour-hasard');
    if (play === undefined) {
      throw new Error('Play not found.');
    }
    expect(performances.map((s) => s.id)).toContain(buildPerformanceId(play, { day: '2026-11-28', startMinutes: 1200 }));
    expect(suggestPerformance(play, findVenue(DEMO_VENUES, play), criteria({ day: '2026-11-28', departureMinutes: 1110 }))?.startMinutes).toBe(1200);
  });

  it('each performance shows its computed end (range between two durations) or « ? » when the duration is unknown', () => {
    expect(jeu({ day: '2026-11-28' }).performances.map((s) => s.exitLabel)).toEqual(['18h15–18h25', '21h45–21h55']);
    const vasseur = slides().find((d) => d.id === 'vasseur');
    expect(vasseur?.performances.map((s) => s.exitLabel)).toEqual([null]);
  });

  it('a day without a performance of the play offers its first scheduled day', () => {
    const cyrano = slides({ day: '2026-11-27' }).find((d) => d.id === 'cyrano');
    expect(cyrano?.performancesHeader).toBe('Pas de séance vendredi · Samedi 28 novembre');
    expect(cyrano?.performances.map((s) => s.timeLabel)).toEqual(['20h00']);
  });

  it('text fields come from the demo data: venue, address, durations, synopsis', () => {
    const d = jeu();
    expect(d.venueAndDistrict).toBe('Théâtre de la Rotonde · Paris 20e');
    expect(d.addressAndDuration).toBe('4 place de la Rotonde · 1 h 45 ou 1 h 55');
    expect(d.authorAndGenres).toBe('Marivaux · Comédie, Classique');
    expect(d.synopsis).toContain('Silvia et Dorante');
  });
});
