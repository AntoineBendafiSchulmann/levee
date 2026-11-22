import { describe, expect, it } from 'vitest';

import { DEMO_CRITERES_INITIAUX } from '../donnees-demo/criteres.demo';
import { DEMO_SALLES } from '../donnees-demo/salles.demo';
import { DEMO_SPECTACLES } from '../donnees-demo/spectacles.demo';
import { construireResultats } from '../domaine/resultats';
import { identifiantSeance } from '../domaine/seance';
import type { CriteresSortie, Spectacle } from '../domaine/types';
import { SELECTION_MAX, selectionSoiree } from './selection';

const criteres = (surcharge: Partial<CriteresSortie> = {}): CriteresSortie => ({ ...DEMO_CRITERES_INITIAUX, ...surcharge });
const selection = (surcharge: Partial<CriteresSortie> = {}, spectacles: readonly Spectacle[] = DEMO_SPECTACLES) =>
  selectionSoiree(construireResultats(spectacles, DEMO_SALLES, criteres(surcharge)));

describe('sélection de séances sous l’accueil', () => {
  it('jeudi 26, République 18h30, limite 22h00 : trois séances possibles, dans l’ordre des résultats', () => {
    const choisies = selection();
    expect(choisies).toHaveLength(SELECTION_MAX);
    expect(choisies.map((r) => `${r.spectacle.titre} ${String(r.seance.debutMinutes)}`)).toEqual([
      'Huis clos 1155',
      'L’Avare 1200',
      'Le Misanthrope 1200',
    ]);
    expect(choisies.every((r) => r.evaluation.groupe === 'possible')).toBe(true);
  });

  it('ne retient que les séances possibles : une séance à vérifier ou impossible n’y figure pas', () => {
    const tous = construireResultats(DEMO_SPECTACLES, DEMO_SALLES, criteres());
    expect(tous.visibles.some((r) => r.evaluation.groupe !== 'possible')).toBe(true);
    expect(selectionSoiree(tous).every((r) => r.evaluation.groupe === 'possible')).toBe(true);
  });

  it('suit les critères : samedi 28 à partir de 16h00, la séance de 16h30 du Jeu vient en tête', () => {
    const [premiere] = selection({ jour: '2026-11-28', departMinutes: 960 });
    expect(premiere?.spectacle.id).toBe('jeu-amour-hasard');
    expect(premiere?.seance.debutMinutes).toBe(990);
  });

  it('une pièce jouée deux fois le même jour donne deux entrées, chacune avec l’identifiant de sa séance', () => {
    const jeu = DEMO_SPECTACLES.find((s) => s.id === 'jeu-amour-hasard');
    if (jeu === undefined) {
      throw new Error('Spectacle de démonstration introuvable.');
    }
    const entrees = selection({ jour: '2026-11-28', departMinutes: 960 }, [jeu]);
    expect(entrees.map((r) => r.id)).toEqual([
      identifiantSeance(jeu, { jour: '2026-11-28', debutMinutes: 990 }),
      identifiantSeance(jeu, { jour: '2026-11-28', debutMinutes: 1200 }),
    ]);
  });

  it('« Arrivée serrée » est à vérifier, pas possible : exclue de la sélection comme du compteur « possibles »', () => {
    // Samedi 28, départ 16h05 : arrivée du Jeu à 16h23 pour 16h30, soit 7 min de marge (seuil : 10 min).
    const c = criteres({ jour: '2026-11-28', departMinutes: 965 });
    const resultats = construireResultats(DEMO_SPECTACLES, DEMO_SALLES, c);
    const serree = resultats.visibles.find((r) => r.spectacle.id === 'jeu-amour-hasard' && r.seance.debutMinutes === 990);
    expect(serree?.evaluation.statut).toBe('arrivee-serree');
    expect(serree?.evaluation.groupe).toBe('a-verifier');
    expect(resultats.compteurs.possibles).toBe(resultats.visibles.filter((r) => r.evaluation.groupe === 'possible').length);
    expect(selectionSoiree(resultats).map((r) => r.id)).not.toContain(serree?.id);
    expect(selectionSoiree(resultats)).toHaveLength(SELECTION_MAX);
  });

  it('aucune séance compatible : sélection vide', () => {
    expect(selection({ departMinutes: 1260, limiteMinutes: 1200 })).toEqual([]);
  });
});
