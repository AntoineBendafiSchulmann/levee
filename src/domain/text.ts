/** « 1 séance », « 0 séance » but « 2 séances »: the plural starts at 2. */
export function pluralize(count: number, singular: string, pluralText: string): string {
  return `${String(count)} ${count > 1 ? pluralText : singular}`;
}

/** Lowercase without accents, to compare free-text input (« moliere » matches « Molière »). */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
