import type { Duree, JourIso } from './types';

/** 1320 → « 22h00 ». */
export function formaterHeure(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h)}h${String(m).padStart(2, '0')}`;
}

/** 105 → « 105 min » : un nombre de minutes tel quel, pour un écart plutôt qu'une durée de spectacle. */
export function libelleMinutes(minutes: number): string {
  return `${String(minutes)} min`;
}

/** 110 → « 1 h 50 », 45 → « 45 min ». */
export function formaterDuree(minutes: number): string {
  if (minutes < 60) {
    return `${String(minutes)} min`;
  }
  return `${String(Math.floor(minutes / 60))} h ${String(minutes % 60).padStart(2, '0')}`;
}

/**
 * Les dates ISO sont interprétées et formatées en UTC : le jour affiché ne dépend donc
 * jamais du fuseau horaire de l'appareil.
 */
function enDate(jour: JourIso): Date {
  const morceaux = /^(\d{4})-(\d{2})-(\d{2})$/.exec(jour);
  if (morceaux === null) {
    throw new Error(`Jour invalide : « ${jour} » (format attendu AAAA-MM-JJ).`);
  }
  return new Date(Date.UTC(Number(morceaux[1]), Number(morceaux[2]) - 1, Number(morceaux[3])));
}

function formater(jour: JourIso, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('fr-FR', { ...options, timeZone: 'UTC' }).format(enDate(jour));
}

function capitaliser(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/** « Jeudi 26 novembre ». */
export function libelleJourLong(jour: JourIso): string {
  return capitaliser(formater(jour, { weekday: 'long', day: 'numeric', month: 'long' }));
}

/** « Ce soir » pour le jour courant, sinon « Ven. 27 ». */
export function libelleJourCourt(jour: JourIso, aujourdhui: JourIso): string {
  if (jour === aujourdhui) {
    return 'Ce soir';
  }
  return capitaliser(formater(jour, { weekday: 'short', day: 'numeric' }));
}

/** « ce soir » pour le jour courant, sinon « samedi ». */
export function libelleJourDu(jour: JourIso, aujourdhui: JourIso): string {
  return jour === aujourdhui ? 'ce soir' : formater(jour, { weekday: 'long' });
}

/** « sam. 28 nov. » : le jour en abrégé, avec le mois. */
export function libelleJourBref(jour: JourIso): string {
  return formater(jour, { weekday: 'short', day: 'numeric', month: 'short' });
}

/** 0,35 → « 350 m », 2,4 → « 2,4 km ». */
export function formaterDistance(kilometres: number): string {
  return kilometres < 1
    ? `${String(Math.round(kilometres * 1000))} m`
    : `${kilometres.toFixed(1).replace('.', ',')} km`;
}

/** « 21h50 » pour une fin certaine, « 21h45–21h55 » pour une plage entre deux durées annoncées. */
export function formaterPlageHeures(fin: { readonly min: number; readonly max: number }): string {
  return fin.min === fin.max ? formaterHeure(fin.min) : `${formaterHeure(fin.min)}–${formaterHeure(fin.max)}`;
}

/** Durées annoncées distinctes, en minutes, de la plus courte à la plus longue (sans doublon ; vide si aucune n'est annoncée). */
export function dureesDistinctes(durees: readonly Duree[]): number[] {
  return [...new Set(durees.map((duree) => duree.minutes))].sort((a, b) => a - b);
}
