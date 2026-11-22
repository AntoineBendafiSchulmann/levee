import { describe, expect, it } from 'vitest';

import { DEMO_CRITERES_INITIAUX } from '../donnees-demo/criteres.demo';
import { DEMO_SALLES } from '../donnees-demo/salles.demo';
import { DEMO_SPECTACLES } from '../donnees-demo/spectacles.demo';
import { construireResultats, resultatDeSeance } from './resultats';
import { choisirSeance, identifiantSeance, resoudrePagePiece, trouverSalle, trouverSeance } from './seance';
import type { CriteresSortie, Spectacle } from './types';

const SAMEDI = '2026-11-28';
const criteres = (surcharge: Partial<CriteresSortie> = {}): CriteresSortie => ({ ...DEMO_CRITERES_INITIAUX, ...surcharge });
const spectacle = (id: string): Spectacle => {
  const trouve = DEMO_SPECTACLES.find((s) => s.id === id);
  if (trouve === undefined) {
    throw new Error(`Spectacle ${id} introuvable.`);
  }
  return trouve;
};
const JEU = spectacle('jeu-amour-hasard');
const heure = (h: number, m = 0) => h * 60 + m;

describe('identifiant de séance', () => {
  it('est unique : les deux représentations du Jeu le samedi ont chacune le leur', () => {
    const ids = JEU.seances.map((s) => identifiantSeance(JEU, s));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(`jeu-amour-hasard-${SAMEDI}-${String(heure(20))}`);
    expect(ids).toContain(`jeu-amour-hasard-${SAMEDI}-${String(heure(16, 30))}`);
  });

  it('est celui des résultats : la carte de 20 h porte l’identifiant de la séance de 20 h', () => {
    const resultats = construireResultats(DEMO_SPECTACLES, DEMO_SALLES, criteres({ jour: SAMEDI, departMinutes: heure(16) }));
    const jeu = resultats.visibles.filter((r) => r.spectacle.id === JEU.id);
    expect(jeu.map((r) => r.id)).toEqual([
      identifiantSeance(JEU, { jour: SAMEDI, debutMinutes: heure(16, 30) }),
      identifiantSeance(JEU, { jour: SAMEDI, debutMinutes: heure(20) }),
    ]);
  });

  it('retrouve la séance exacte, quelle que soit l’autre représentation du jour', () => {
    const trouvee = trouverSeance(DEMO_SPECTACLES, identifiantSeance(JEU, { jour: SAMEDI, debutMinutes: heure(20) }));
    expect(trouvee?.spectacle.id).toBe(JEU.id);
    expect(trouvee?.seance).toEqual({ jour: SAMEDI, debutMinutes: heure(20) });
  });

  it('ne retrouve rien pour un identifiant inconnu ou pour une heure qui n’existe pas', () => {
    expect(trouverSeance(DEMO_SPECTACLES, 'inconnu-2026-11-28-1200')).toBeUndefined();
    expect(trouverSeance(DEMO_SPECTACLES, `jeu-amour-hasard-${SAMEDI}-1201`)).toBeUndefined();
  });
});

describe('séance présélectionnée à l’ouverture d’une pièce', () => {
  const salle = trouverSalle(DEMO_SALLES, JEU);
  const choix = (surcharge: Partial<CriteresSortie>) => choisirSeance(JEU, salle, criteres(surcharge))?.debutMinutes;

  it('samedi, départ 16h00 : 16h30 (la première qui convient)', () => {
    expect(choix({ jour: SAMEDI, departMinutes: heure(16) })).toBe(heure(16, 30));
  });

  it('samedi, départ 18h30 : 20h00, la séance de 16h30 a commencé', () => {
    expect(choix({ jour: SAMEDI, departMinutes: heure(18, 30) })).toBe(heure(20));
  });

  it('préfère une séance « possible » à une séance seulement à vérifier', () => {
    // Fin incertaine à 20h00 avec une limite à 21h50, mais 16h30 finit à 18h15 : elle convient.
    expect(choix({ jour: SAMEDI, departMinutes: heure(16), limiteMinutes: heure(21, 50) })).toBe(heure(16, 30));
    // Départ 18h30 : seule 20h00 reste, elle est choisie même si sa fin est incertaine.
    expect(choix({ jour: SAMEDI, departMinutes: heure(18, 30), limiteMinutes: heure(21, 50) })).toBe(heure(20));
  });

  it('jour sans séance : la prochaine séance après ce jour, sinon la première de la pièce', () => {
    const vasseur = spectacle('vasseur');
    const salleVasseur = trouverSalle(DEMO_SALLES, vasseur);
    expect(choisirSeance(vasseur, salleVasseur, criteres({ jour: '2026-11-25' }))).toEqual({ jour: '2026-11-26', debutMinutes: 1140 });
    // Dimanche : plus aucune séance de cette pièce ; la fiche reste ouvrable sur sa première séance.
    expect(choisirSeance(vasseur, salleVasseur, criteres({ jour: '2026-11-29' }))).toEqual({ jour: '2026-11-26', debutMinutes: 1140 });
  });

  it('toutes les séances du jour avant le départ : la première du jour', () => {
    expect(choix({ jour: SAMEDI, departMinutes: heure(23) })).toBe(heure(16, 30));
  });

  it('l’horaire annoncé sur l’affiche est celui de la fiche (même règle) pour tous les départs et tous les jours', () => {
    for (const jour of ['2026-11-26', '2026-11-27', SAMEDI, '2026-11-29']) {
      for (const departMinutes of [heure(14), heure(16), heure(18, 30), heure(21)]) {
        for (const spectacleDemo of DEMO_SPECTACLES) {
          const attendu = choisirSeance(spectacleDemo, trouverSalle(DEMO_SALLES, spectacleDemo), criteres({ jour, departMinutes }));
          const pagePiece = resoudrePagePiece(DEMO_SPECTACLES, DEMO_SALLES, { type: 'piece', id: spectacleDemo.id }, criteres({ jour, departMinutes }));
          expect(pagePiece?.seance).toEqual(attendu);
        }
      }
    }
  });
});

describe('résolution d’une adresse de fiche', () => {
  it('/seances/:id garde la séance demandée même si les critères en préféreraient une autre', () => {
    const id = identifiantSeance(JEU, { jour: SAMEDI, debutMinutes: heure(20) });
    const pagePiece = resoudrePagePiece(DEMO_SPECTACLES, DEMO_SALLES, { type: 'seance', id }, criteres({ jour: SAMEDI, departMinutes: heure(16) }));
    expect(pagePiece?.seance.debutMinutes).toBe(heure(20));
    expect(pagePiece?.salle.id).toBe('rotonde');
  });

  it('une pièce ou une séance inconnue ne donne pas de fiche', () => {
    expect(resoudrePagePiece(DEMO_SPECTACLES, DEMO_SALLES, { type: 'piece', id: 'inconnue' }, criteres())).toBeUndefined();
    expect(resoudrePagePiece(DEMO_SPECTACLES, DEMO_SALLES, { type: 'seance', id: 'inconnue' }, criteres())).toBeUndefined();
  });
});

describe('fiche : samedi 28 novembre, Jeu de 20 h', () => {
  const salle = trouverSalle(DEMO_SALLES, JEU);
  const seance = { jour: SAMEDI, debutMinutes: heure(20) };

  it('limite 22h00 : à temps ; limite 21h50 : fin incertaine (21h45–21h55)', () => {
    expect(resultatDeSeance(JEU, salle, seance, criteres({ jour: SAMEDI })).evaluation.statut).toBe('a-temps');
    const incertaine = resultatDeSeance(JEU, salle, seance, criteres({ jour: SAMEDI, limiteMinutes: heure(21, 50) })).evaluation;
    expect(incertaine.statut).toBe('fin-incertaine');
    expect(incertaine.fin).toEqual({ min: heure(21, 45), max: heure(21, 55) });
  });

  it('le statut de la fiche est celui de la carte de résultats', () => {
    const c = criteres({ jour: SAMEDI, limiteMinutes: heure(21, 50) });
    const carte = construireResultats(DEMO_SPECTACLES, DEMO_SALLES, c).visibles.find((r) => r.id === identifiantSeance(JEU, seance));
    expect(carte?.evaluation).toEqual(resultatDeSeance(JEU, salle, seance, c).evaluation);
  });
});
