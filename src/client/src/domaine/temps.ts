import type { JourIso } from './types';

/** 1320 → « 22h00 ». */
export function formaterHeure(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h)}h${String(m).padStart(2, '0')}`;
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
