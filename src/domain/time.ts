import type { AnnouncedDuration, IsoDay } from './types';

/** 1320 → « 22h00 ». */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h)}h${String(m).padStart(2, '0')}`;
}

/** 105 → « 105 min » : a minute count as is, for a gap rather than a show duration. */
export function minutesLabel(minutes: number): string {
  return `${String(minutes)} min`;
}

/** 110 → « 1 h 50 », 45 → « 45 min ». */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${String(minutes)} min`;
  }
  return `${String(Math.floor(minutes / 60))} h ${String(minutes % 60).padStart(2, '0')}`;
}

/**
 * ISO dates are parsed and formatted in UTC, so the displayed day never depends
 * on the device's time zone.
 */
function toDate(day: IsoDay): Date {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (parts === null) {
    throw new Error(`Invalid day: « ${day} » (expected format YYYY-MM-DD).`);
  }
  return new Date(Date.UTC(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3])));
}

function formatDate(day: IsoDay, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('fr-FR', { ...options, timeZone: 'UTC' }).format(toDate(day));
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** « Jeudi 26 novembre ». */
export function dayLongLabel(day: IsoDay): string {
  return capitalize(formatDate(day, { weekday: 'long', day: 'numeric', month: 'long' }));
}

/** « Ce soir » for the current day, otherwise « Ven. 27 ». */
export function dayShortLabel(day: IsoDay, today: IsoDay): string {
  if (day === today) {
    return 'Ce soir';
  }
  return capitalize(formatDate(day, { weekday: 'short', day: 'numeric' }));
}

/** « ce soir » for the current day, otherwise « samedi ». */
export function dayPhrase(day: IsoDay, today: IsoDay): string {
  return day === today ? 'ce soir' : formatDate(day, { weekday: 'long' });
}

/** « sam. 28 nov. »: abbreviated day, with the month. */
export function dayBriefLabel(day: IsoDay): string {
  return formatDate(day, { weekday: 'short', day: 'numeric', month: 'short' });
}

/** 0,35 → « 350 m », 2,4 → « 2,4 km ». */
export function formatDistance(kilometers: number): string {
  return kilometers < 1
    ? `${String(Math.round(kilometers * 1000))} m`
    : `${kilometers.toFixed(1).replace('.', ',')} km`;
}

/** « 21h50 » for a certain end, « 21h45–21h55 » for a range between two announced durations. */
export function formatTimeRange(end: { readonly min: number; readonly max: number }): string {
  return end.min === end.max ? formatTime(end.min) : `${formatTime(end.min)}–${formatTime(end.max)}`;
}

/** Distinct announced durations, in minutes, shortest to longest (no duplicates; empty if none is announced). */
export function distinctDurations(announcedDurations: readonly AnnouncedDuration[]): number[] {
  return [...new Set(announcedDurations.map((duration) => duration.minutes))].sort((a, b) => a - b);
}
