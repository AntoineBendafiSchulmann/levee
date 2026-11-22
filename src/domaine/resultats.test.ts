import { describe, expect, it } from 'vitest';

import { DEMO_CRITERES_INITIAUX } from '../donnees-demo/criteres.demo';
import { DEMO_SALLES } from '../donnees-demo/salles.demo';
import { DEMO_SPECTACLES } from '../donnees-demo/spectacles.demo';
import { libelleBoutonVoir, libelleCompteurs, construireResultats } from './resultats';
import type { CriteresSortie, Salle, Spectacle } from './types';

const SAMEDI = '2026-11-28';
const criteres = (surcharge: Partial<CriteresSortie> = {}): CriteresSortie => ({
  ...DEMO_CRITERES_INITIAUX,
  ...surcharge,
});
const calculer = (surcharge: Partial<CriteresSortie> = {}) =>
  construireResultats(DEMO_SPECTACLES, DEMO_SALLES, criteres(surcharge));
const resume = (surcharge: Partial<CriteresSortie> = {}) =>
  calculer(surcharge).visibles.map((r) => `${r.spectacle.titre} ${String(r.seance.debutMinutes)} ${r.evaluation.statut}`);

describe('parcours de référence : samedi 28 novembre, République 18h30, limite 22h00', () => {
  const resultats = calculer({ jour: SAMEDI });

  it('liste six séances, par heure de début', () => {
    expect(resultats.visibles.map((r) => r.seance.debutMinutes)).toEqual([1125, 1140, 1170, 1200, 1200, 1215]);
  });

  it('classe chaque séance comme dans la maquette', () => {
    expect(resume({ jour: SAMEDI })).toEqual([
      'L’Avare 1125 arrivee-tardive',
      'Un dîner chez les Vasseur 1140 duree-inconnue',
      'Le Misanthrope 1170 a-temps',
      'Cyrano de Bergerac 1200 fin-depassee',
      'Le Jeu de l’amour et du hasard 1200 a-temps',
      'La Clé sous la porte 1215 a-temps',
    ]);
  });

  it('totalise 3 possibles, 1 à vérifier, 2 impossibles', () => {
    expect(resultats.compteurs).toEqual({ possibles: 3, aVerifier: 1, impossibles: 2 });
  });

  it('met à part les séances qui commencent avant le départ, sans les évaluer', () => {
    expect(resultats.avantDepart.map((s) => `${s.titre} ${String(s.debutMinutes)}`)).toEqual([
      'Le Jeu de l’amour et du hasard 990',
      'Huis clos 1095',
    ]);
  });

  it('les cartes listées et les séances avant le départ couvrent toutes les séances du jour', () => {
    const duJour = DEMO_SPECTACLES.flatMap((s) => s.seances).filter((s) => s.jour === SAMEDI).length;
    expect(resultats.visibles.length + resultats.avantDepart.length).toBe(duJour);
  });

  it('jeudi, les totaux 4 / 1 / 1 couvrent les six séances du soir', () => {
    const jeudi = calculer();
    expect(jeudi.compteurs).toEqual({ possibles: 4, aVerifier: 1, impossibles: 1 });
    expect(jeudi.visibles).toHaveLength(6);
  });
});

describe('une même pièce jouée deux fois le même jour', () => {
  it('donne deux résultats distincts, avec des identifiants différents', () => {
    const jeu = calculer({ jour: SAMEDI, departMinutes: 16 * 60 }).visibles.filter(
      (r) => r.spectacle.id === 'jeu-amour-hasard',
    );
    expect(jeu.map((r) => r.seance.debutMinutes)).toEqual([990, 1200]);
    expect(new Set(jeu.map((r) => r.id)).size).toBe(2);
    expect(jeu.map((r) => r.evaluation.statut)).toEqual(['a-temps', 'a-temps']);
  });

  it('chaque représentation a son propre statut quand la limite passe à 21h50', () => {
    const jeu = calculer({ jour: SAMEDI, departMinutes: 16 * 60, limiteMinutes: 21 * 60 + 50 }).visibles.filter(
      (r) => r.spectacle.id === 'jeu-amour-hasard',
    );
    expect(jeu.map((r) => r.evaluation.statut)).toEqual(['a-temps', 'fin-incertaine']);
  });

  it('avec le départ à 18h30, la séance de 16h30 est écartée et celle de 20h00 reste', () => {
    const jeu = calculer({ jour: SAMEDI }).visibles.filter((r) => r.spectacle.id === 'jeu-amour-hasard');
    expect(jeu.map((r) => r.seance.debutMinutes)).toEqual([1200]);
  });
});

describe('reclassement quand la limite passe de 22h00 à 21h50', () => {
  it('le Jeu de l’amour et du hasard de 20h00 passe de « à temps » à « fin incertaine »', () => {
    const avant = resume({ jour: SAMEDI }).filter((l) => l.includes('Jeu'));
    const apres = resume({ jour: SAMEDI, limiteMinutes: 21 * 60 + 50 }).filter((l) => l.includes('Jeu'));
    expect(avant).toEqual(['Le Jeu de l’amour et du hasard 1200 a-temps']);
    expect(apres).toEqual(['Le Jeu de l’amour et du hasard 1200 fin-incertaine']);
  });
});

describe('filtres', () => {
  it('un genre : seuls les spectacles de ce genre', () => {
    const titres = calculer({ jour: SAMEDI, departMinutes: 16 * 60, genres: ['drame'] }).visibles.map((r) => r.spectacle.titre);
    expect(titres).toEqual(['Huis clos']);
  });

  it('plusieurs genres : un spectacle qui en a un seul des deux suffit', () => {
    const titres = calculer({ jour: SAMEDI, departMinutes: 16 * 60, genres: ['drame', 'contemporain'] }).visibles.map(
      (r) => r.spectacle.titre,
    );
    expect(titres).toEqual(['Huis clos', 'Un dîner chez les Vasseur', 'La Clé sous la porte']);
  });

  it('auteur : sans accents ni casse (deux séances à 20h00 jeudi, départagées par titre)', () => {
    const titres = calculer({ auteur: 'MOLIERE' }).visibles.map((r) => r.spectacle.titre);
    expect(titres).toEqual(['L’Avare', 'Le Misanthrope']);
  });

  it('auteur : une partie du nom suffit', () => {
    expect(calculer({ auteur: 'ormes' }).visibles.map((r) => r.spectacle.titre)).toEqual(['Un dîner chez les Vasseur']);
  });

  it('genre et auteur se cumulent', () => {
    expect(calculer({ genres: ['drame'], auteur: 'molière' }).visibles).toEqual([]);
  });

  it('un jour sans séance donne un résultat vide, sans erreur', () => {
    const vide = calculer({ jour: '2026-11-30' });
    expect(vide.visibles).toEqual([]);
    expect(vide.compteurs).toEqual({ possibles: 0, aVerifier: 0, impossibles: 0 });
  });

  it('un départ postérieur à toutes les séances ne laisse rien à lister', () => {
    expect(calculer({ departMinutes: 21 * 60 }).visibles).toEqual([]);
  });

  it('classe à égalité d’heure par titre', () => {
    const titres = calculer({ jour: SAMEDI }).visibles.filter((r) => r.seance.debutMinutes === 1200).map((r) => r.spectacle.titre);
    expect(titres).toEqual(['Cyrano de Bergerac', 'Le Jeu de l’amour et du hasard']);
  });
});

describe('masquage des impossibles', () => {
  const masque = calculer({ jour: SAMEDI, masquerImpossibles: true });

  it('retire les cartes impossibles mais garde les totaux de toutes les séances listées', () => {
    expect(masque.visibles).toHaveLength(4);
    expect(masque.visibles.every((r) => r.evaluation.groupe !== 'impossible')).toBe(true);
    expect(masque.compteurs).toEqual({ possibles: 3, aVerifier: 1, impossibles: 2 });
    expect(masque.impossiblesMasquees).toBe(true);
  });

  it('ne signale rien quand il n’y a aucune séance impossible à masquer', () => {
    expect(calculer({ jour: '2026-11-27', limiteMinutes: 23 * 60, masquerImpossibles: true }).impossiblesMasquees).toBe(false);
  });
});

describe('libellés des compteurs et du bouton', () => {
  it('énumère les groupes, omet « à vérifier » et « impossibles » quand ils valent 0', () => {
    expect(libelleCompteurs({ possibles: 3, aVerifier: 1, impossibles: 2 }, false)).toBe('3 possibles · 1 à vérifier · 2 impossibles');
    expect(libelleCompteurs({ possibles: 1, aVerifier: 0, impossibles: 1 }, false)).toBe('1 possible · 1 impossible');
    expect(libelleCompteurs({ possibles: 0, aVerifier: 0, impossibles: 0 }, false)).toBe('Aucune séance');
  });

  it('indique le masquage à côté du nombre d’impossibles', () => {
    expect(libelleCompteurs({ possibles: 3, aVerifier: 1, impossibles: 2 }, true)).toBe(
      '3 possibles · 1 à vérifier · 2 impossibles (masquées)',
    );
    expect(libelleCompteurs({ possibles: 3, aVerifier: 0, impossibles: 1 }, true)).toBe('3 possibles · 1 impossible (masquée)');
  });

  it('le bouton compte les cartes visibles', () => {
    expect(libelleBoutonVoir(6)).toBe('Voir 6 séances');
    expect(libelleBoutonVoir(1)).toBe('Voir 1 séance');
    expect(libelleBoutonVoir(0)).toBe('Voir 0 séance');
    const masque = calculer({ jour: SAMEDI, masquerImpossibles: true });
    expect(libelleBoutonVoir(masque.visibles.length)).toBe('Voir 4 séances');
  });
});

describe('données manquantes dans un résultat', () => {
  const salleSansTrajet: Salle = { id: 'x', nom: 'Salle X', quartier: 'Paris 1er', adresse: '1 rue de Test', trajets: {} };
  const sansDuree: Spectacle = { ...(DEMO_SPECTACLES[0] as Spectacle), id: 'sans-duree', salleId: 'x', durees: [] };

  it('une salle sans trajet pour ce départ donne « trajet-inconnu », comptée à vérifier', () => {
    const r = construireResultats([sansDuree], [salleSansTrajet], criteres());
    expect(r.visibles[0]?.evaluation.statut).toBe('trajet-inconnu');
    expect(r.compteurs.aVerifier).toBe(1);
  });

  it('un spectacle dont la salle est inconnue est une erreur de données, signalée clairement', () => {
    expect(() => construireResultats([sansDuree], [], criteres())).toThrow(/Salle inconnue/);
  });
});
