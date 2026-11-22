/** Les éléments qui peuvent retrouver le focus au retour d'une fiche portent `data-cle` (clé de la séance ou de la pièce). */
export function focaliserCle(cle: string): HTMLElement | null {
  const element = document.querySelector<HTMLElement>(`[data-cle="${CSS.escape(cle)}"]`);
  element?.focus({ preventScroll: true });
  return element;
}

/**
 * Garde `element` dans la zone de lecture d'un conteneur qui défile verticalement. `hautMasque` est la limite
 * basse d'un bandeau collant qui recouvre le haut du conteneur (0 s'il n'y en a pas). Un élément déjà visible
 * ne bouge pas d'un pixel ; sinon on centre sa carte (`closest('article')`) dans la zone de lecture, ou
 * l'élément lui-même si la carte est plus haute que la zone.
 */
export function ramenerEnVue(element: HTMLElement, conteneur: HTMLElement, hautMasque: number): void {
  const zone = conteneur.getBoundingClientRect();
  const haut = Math.max(zone.top, hautMasque);
  const bas = zone.bottom;
  const lien = element.getBoundingClientRect();
  if (lien.top >= haut && lien.bottom <= bas) {
    return;
  }
  const carte = element.closest('article')?.getBoundingClientRect();
  const cible = carte !== undefined && carte.height <= bas - haut ? carte : lien;
  conteneur.scrollTop += cible.top - haut - (bas - haut - cible.height) / 2;
}
