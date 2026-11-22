import type { MouseEvent } from 'react';

/** Clic principal sans modificateur : un clic modifié (nouvel onglet, etc.) est laissé au navigateur. */
export function estClicSimple(evenement: MouseEvent): boolean {
  return evenement.button === 0 && !evenement.metaKey && !evenement.ctrlKey && !evenement.shiftKey && !evenement.altKey;
}

/**
 * Gestionnaire de clic d'un lien interne (`<a href>`) : un clic simple est pris en charge (la navigation du
 * navigateur est annulée, `agir` s'en occupe) ; un clic modifié (Ctrl, Cmd, Maj, Alt, bouton du milieu) suit le
 * lien normalement, donc l'ouverture dans un nouvel onglet est préservée. `agir` reçoit l'évènement quand la
 * décision dépend de lui (par exemple l'activation au clavier : `detail === 0`).
 */
export function surClicSimple<E extends Element>(agir: (evenement: MouseEvent<E>) => void) {
  return (evenement: MouseEvent<E>): void => {
    if (!estClicSimple(evenement)) {
      return;
    }
    evenement.preventDefault();
    agir(evenement);
  };
}
