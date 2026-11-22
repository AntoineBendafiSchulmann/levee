import { describe, expect, it } from 'vitest';

import { DEMO_AUJOURDHUI, DEMO_CRITERES_INITIAUX } from '../donnees-demo/criteres.demo';
import { DEMO_SALLES } from '../donnees-demo/salles.demo';
import { DEMO_SPECTACLES } from '../donnees-demo/spectacles.demo';
import { choisirSeance, identifiantSeance, resoudrePagePiece, trouverSalle } from '../domaine/seance';
import { formaterHeure, libelleJourCourt } from '../domaine/temps';
import type { CriteresSortie } from '../domaine/types';
import { construireDiapos } from './diapos';

const criteres = (surcharge: Partial<CriteresSortie> = {}): CriteresSortie => ({ ...DEMO_CRITERES_INITIAUX, ...surcharge });
const diapos = (surcharge: Partial<CriteresSortie> = {}) =>
  construireDiapos(DEMO_SPECTACLES, DEMO_SALLES, criteres(surcharge), DEMO_AUJOURDHUI);
const jeu = (surcharge: Partial<CriteresSortie> = {}) => {
  const trouvee = diapos(surcharge).find((d) => d.id === 'jeu-amour-hasard');
  if (trouvee === undefined) {
    throw new Error('Affiche du Jeu introuvable.');
  }
  return trouvee;
};

describe('affiches de l’accueil', () => {
  it('samedi 28 : la légende du Jeu annonce 16h30 depuis 16h00 et 20h00 depuis 18h30', () => {
    expect(jeu({ jour: '2026-11-28', departMinutes: 960 }).legende).toBe('Sam. 28 · 16h30');
    expect(jeu({ jour: '2026-11-28', departMinutes: 1110 }).legende).toBe('Sam. 28 · 20h00');
  });

  it('la légende de chaque affiche est l’horaire que la fiche présélectionne, pour tous les jours et départs', () => {
    for (const jour of ['2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29']) {
      for (const departMinutes of [840, 960, 1110, 1260]) {
        const c = criteres({ jour, departMinutes });
        for (const diapo of construireDiapos(DEMO_SPECTACLES, DEMO_SALLES, c, DEMO_AUJOURDHUI)) {
          const pagePiece = resoudrePagePiece(DEMO_SPECTACLES, DEMO_SALLES, { type: 'piece', id: diapo.id }, c);
          expect(pagePiece).toBeDefined();
          expect(diapo.legende).toBe(
            `${libelleJourCourt(pagePiece?.seance.jour ?? '', DEMO_AUJOURDHUI)} · ${formaterHeure(pagePiece?.seance.debutMinutes ?? 0)}`,
          );
        }
      }
    }
  });

  it('les séances proposées sous l’affiche portent l’identifiant exact et marquent la « Séance proposée »', () => {
    const { seances } = jeu({ jour: '2026-11-28', departMinutes: 1110 });
    expect(seances.map((s) => [s.id, s.heure, s.choisie])).toEqual([
      ['jeu-amour-hasard-2026-11-28-990', '16h30', false],
      ['jeu-amour-hasard-2026-11-28-1200', '20h00', true],
    ]);
    const spectacle = DEMO_SPECTACLES.find((s) => s.id === 'jeu-amour-hasard');
    if (spectacle === undefined) {
      throw new Error('Spectacle introuvable.');
    }
    expect(seances.map((s) => s.id)).toContain(identifiantSeance(spectacle, { jour: '2026-11-28', debutMinutes: 1200 }));
    expect(choisirSeance(spectacle, trouverSalle(DEMO_SALLES, spectacle), criteres({ jour: '2026-11-28', departMinutes: 1110 }))?.debutMinutes).toBe(1200);
  });

  it('chaque séance affiche sa fin calculée (plage entre deux durées) ou « ? » quand la durée est inconnue', () => {
    expect(jeu({ jour: '2026-11-28' }).seances.map((s) => s.sortie)).toEqual(['18h15–18h25', '21h45–21h55']);
    const vasseur = diapos().find((d) => d.id === 'vasseur');
    expect(vasseur?.seances.map((s) => s.sortie)).toEqual([null]);
  });

  it('un jour sans séance de la pièce propose son premier jour de programmation', () => {
    const cyrano = diapos({ jour: '2026-11-27' }).find((d) => d.id === 'cyrano');
    expect(cyrano?.enteteSeances).toBe('Pas de séance vendredi · Samedi 28 novembre');
    expect(cyrano?.seances.map((s) => s.heure)).toEqual(['20h00']);
  });

  it('les champs de texte viennent des données de démonstration : salle, adresse, durées, synopsis', () => {
    const d = jeu();
    expect(d.salleQuartier).toBe('Théâtre de la Rotonde · Paris 20e');
    expect(d.adresseDuree).toBe('4 place de la Rotonde · 1 h 45 ou 1 h 55');
    expect(d.auteurGenres).toBe('Marivaux · Comédie, Classique');
    expect(d.synopsis).toContain('Silvia et Dorante');
  });
});
