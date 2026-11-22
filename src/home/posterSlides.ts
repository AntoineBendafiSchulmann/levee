import type { PerformanceGroup, PerformanceStatus } from '../domain/evaluation';
import { genreLabel } from '../domain/genres';
import { availableDays } from '../domain/schedule';
import { performanceResult } from '../domain/results';
import { suggestPerformance, buildPerformanceId, findVenue } from '../domain/performances';
import {
  distinctDurations,
  formatDuration,
  formatTime,
  formatTimeRange,
  dayShortLabel,
  dayPhrase,
  dayLongLabel,
} from '../domain/time';
import type { PosterDesign, OutingCriteria, IsoDay, Venue, Play } from '../domain/types';

/** A performance of the displayed play, offered under the poster: it opens the exact performance. */
export interface SlidePerformance {
  /** Exact performance identifier (`/seances/:id`). */
  readonly id: string;
  /** Focus-return key: distinct from that of the evening performance cards, which use the bare identifier. */
  readonly focusKey: string;
  /** Start time, already formatted (« 20h00 »). */
  readonly timeLabel: string;
  /** Computed end range, or `null` when the duration is unknown. */
  readonly exitLabel: string | null;
  readonly status: PerformanceStatus;
  readonly group: PerformanceGroup;
  /** True for the performance that the detail page preselects. */
  readonly isSuggested: boolean;
}

/** A carousel poster, ready to display, with the play's text when it is showing. */
export interface PosterSlide {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  /** Venue name. */
  readonly venueName: string;
  /** Performance preselected when the detail page opens, e.g. « Ce soir · 20h00 ». */
  readonly caption: string;
  readonly poster: PosterDesign;
  /** « Molière · Comédie, Classique ». */
  readonly authorAndGenres: string;
  /** « Théâtre Saint-Ambroise · Paris 11e ». */
  readonly venueAndDistrict: string;
  /** « 12 rue Saint-Ambroise · 1 h 50 ». */
  readonly addressAndDuration: string;
  readonly synopsis: string;
  /** Title of the performance list: « Ce soir », or « Pas de séance de samedi · Vendredi 27 novembre ». */
  readonly performancesHeader: string;
  /** The play's performances that day, or on the first day it is played. */
  readonly performances: readonly SlidePerformance[];
}

function durationLabel(play: Play): string {
  const minutes = distinctDurations(play.announcedDurations);
  if (minutes.length === 0) {
    return 'durée non annoncée';
  }
  return minutes.map(formatDuration).join(' ou ');
}

/**
 * One slide per play that still has a performance from the chosen day onwards. The caption announces the
 * performance that the detail page preselects (`suggestPerformance`): poster and detail page always show the same time.
 */
export function buildSlides(
  plays: readonly Play[],
  venues: readonly Venue[],
  criteria: OutingCriteria,
  today: IsoDay,
): PosterSlide[] {
  return plays.flatMap((play) => {
    if (!play.performances.some((s) => s.day >= criteria.day)) {
      return [];
    }
    const venue = findVenue(venues, play);
    const suggestedPerformance = suggestPerformance(play, venue, criteria);
    if (suggestedPerformance === undefined) {
      return [];
    }
    const days = availableDays([play]);
    const performanceDay = days.includes(criteria.day) ? criteria.day : (days.find((day) => day >= criteria.day) ?? days[0] ?? criteria.day);
    const performances = play.performances
      .filter((s) => s.day === performanceDay)
      .sort((a, b) => a.startMinutes - b.startMinutes)
      .map((performance): SlidePerformance => {
        const { id, evaluation } = performanceResult(play, venue, performance, criteria);
        return {
          id,
          // The `seance-` prefix is stored in `history.state` (`cleOrigine`) when a play page opens from this row: kept as is.
          focusKey: `seance-${id}`,
          timeLabel: formatTime(performance.startMinutes),
          exitLabel: evaluation.end === null ? null : formatTimeRange(evaluation.end),
          status: evaluation.status,
          group: evaluation.group,
          isSuggested: id === buildPerformanceId(play, suggestedPerformance),
        };
      });
    return [
      {
        id: play.id,
        title: play.title,
        author: play.author,
        venueName: venue.name,
        caption: `${dayShortLabel(suggestedPerformance.day, today)} · ${formatTime(suggestedPerformance.startMinutes)}`,
        poster: play.poster,
        authorAndGenres: `${play.author} · ${play.genres.map(genreLabel).join(', ')}`,
        venueAndDistrict: `${venue.name} · ${venue.district}`,
        addressAndDuration: `${venue.address} · ${durationLabel(play)}`,
        synopsis: play.synopsis,
        performancesHeader:
          performanceDay === criteria.day
            ? dayShortLabel(performanceDay, today)
            : `Pas de séance ${dayPhrase(criteria.day, today)} · ${dayLongLabel(performanceDay)}`,
        performances,
      },
    ];
  });
}
