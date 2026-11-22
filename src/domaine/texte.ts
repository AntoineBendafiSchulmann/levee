/** « 1 séance », « 0 séance » mais « 2 séances » : le pluriel commence à 2. */
export function pluriel(nombre: number, singulier: string, plurielTexte: string): string {
  return `${String(nombre)} ${nombre > 1 ? plurielTexte : singulier}`;
}

/** Minuscules sans accents, pour comparer des saisies libres (« moliere » trouve « Molière »). */
export function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
