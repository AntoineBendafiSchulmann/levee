import { describe, expect, it } from 'vitest';

import { DEMO_CRITERES_INITIAUX } from '../donnees-demo/criteres.demo';
import { DEMO_ORIGINES } from '../donnees-demo/origines.demo';
import { DEMO_SPECTACLES } from '../donnees-demo/spectacles.demo';
import { joursDisponibles } from '../domaine/programme';
import type { CriteresSortie } from '../domaine/types';
import { CLE_CRITERES, criteresValides, ecrireCriteres, lireCriteres, type Stockage } from './stockageCriteres';

const CONTRAINTES = { jours: joursDisponibles(DEMO_SPECTACLES), origines: DEMO_ORIGINES };
const SAISIS: CriteresSortie = {
  ...DEMO_CRITERES_INITIAUX,
  jour: '2026-11-28',
  departMinutes: 960,
  limiteMinutes: 1310,
  genres: ['classique'],
  auteur: 'Marivaux',
  masquerImpossibles: true,
};

function stockageDe(contenu: Record<string, string> = {}): Stockage & { contenu: Record<string, string> } {
  return {
    contenu,
    getItem: (cle) => contenu[cle] ?? null,
    setItem: (cle, valeur) => {
      contenu[cle] = valeur;
    },
  };
}

const refuse: Stockage = {
  getItem: () => {
    throw new DOMException('refusé', 'SecurityError');
  },
  setItem: () => {
    throw new DOMException('plein', 'QuotaExceededError');
  },
};

describe('mémoire des critères de l’onglet', () => {
  it('relit exactement les critères écrits : samedi 28, 16h00, limite 21h50', () => {
    const stockage = stockageDe();
    ecrireCriteres(stockage, SAISIS);
    expect(Object.keys(stockage.contenu)).toEqual([CLE_CRITERES]);
    expect(lireCriteres(stockage, CONTRAINTES)).toEqual(SAISIS);
  });

  it('contrat persisté : relit et réécrit à l’identique le contenu relevé dans un onglet', () => {
    const releve =
      '{"jour":"2026-11-28","origine":"bastille","departMinutes":1110,"limiteMinutes":1320,"genres":["classique"],"auteur":"","masquerImpossibles":false}';
    const stockage = stockageDe({ [CLE_CRITERES]: releve });
    const criteres = lireCriteres(stockage, CONTRAINTES);
    expect(criteres).toEqual({
      jour: '2026-11-28',
      origine: 'bastille',
      departMinutes: 1110,
      limiteMinutes: 1320,
      genres: ['classique'],
      auteur: '',
      masquerImpossibles: false,
    });
    if (criteres !== undefined) {
      ecrireCriteres(stockage, criteres);
    }
    expect(stockage.contenu[CLE_CRITERES]).toBe(releve);
  });

  it('ne met rien dans l’adresse : seule la clé du stockage est utilisée', () => {
    const stockage = stockageDe();
    ecrireCriteres(stockage, SAISIS);
    expect(stockage.contenu[CLE_CRITERES]).toContain('"departMinutes":960');
  });

  it('donnée absente : rien à relire (l’appelant prend les critères initiaux)', () => {
    expect(lireCriteres(stockageDe(), CONTRAINTES)).toBeUndefined();
  });

  it('JSON illisible ou de mauvaise forme : rien à relire', () => {
    for (const brut of ['{pas du json', '', 'null', '42', '"texte"', '[]']) {
      expect(lireCriteres(stockageDe({ [CLE_CRITERES]: brut }), CONTRAINTES)).toBeUndefined();
    }
  });

  it('stockage inaccessible ou plein : ni lecture ni erreur levée', () => {
    expect(lireCriteres(refuse, CONTRAINTES)).toBeUndefined();
    expect(() => {
      ecrireCriteres(refuse, SAISIS);
    }).not.toThrow();
    expect(lireCriteres(undefined, CONTRAINTES)).toBeUndefined();
    expect(() => {
      ecrireCriteres(undefined, SAISIS);
    }).not.toThrow();
  });
});

describe('un JSON lisible n’est accepté que si le domaine l’accepte', () => {
  const refus = (nom: string, changement: Record<string, unknown>) => {
    it(`refuse : ${nom}`, () => {
      expect(criteresValides({ ...SAISIS, ...changement }, CONTRAINTES)).toBeNull();
    });
  };

  it('accepte des critères complets', () => {
    expect(criteresValides(SAISIS, CONTRAINTES)).toEqual(SAISIS);
  });
  refus('origine inconnue', { origine: 'mars' });
  refus('jour non programmé', { jour: '2030-01-01' });
  refus('jour mal formé', { jour: 'samedi' });
  refus('départ qui n’est pas un multiple de 5 minutes', { departMinutes: 962 });
  refus('départ avant la borne basse', { departMinutes: 955 });
  refus('départ après la borne haute', { departMinutes: 21 * 60 + 5 });
  refus('limite hors bornes', { limiteMinutes: 9999 });
  refus('minutes négatives', { departMinutes: -60 });
  refus('minutes décimales', { limiteMinutes: 1310.5 });
  refus('minutes en texte', { departMinutes: '960' });
  refus('minutes non finies', { limiteMinutes: Number.NaN });
  refus('genre inconnu', { genres: ['western'] });
  refus('genre en double', { genres: ['comedie', 'comedie'] });
  refus('genres qui ne sont pas une liste', { genres: 'comedie' });
  refus('auteur qui n’est pas du texte', { auteur: 12 });
  refus('masquage qui n’est pas un booléen', { masquerImpossibles: 'oui' });

  it('refuse un critère manquant', () => {
    const sansAuteur: Record<string, unknown> = { ...SAISIS };
    delete sansAuteur.auteur;
    expect(criteresValides(sansAuteur, CONTRAINTES)).toBeNull();
  });

  it('une seule valeur refusée écarte tout : jamais de critères à moitié restaurés', () => {
    const stockage = stockageDe({ [CLE_CRITERES]: JSON.stringify({ ...SAISIS, origine: 'mars' }) });
    expect(lireCriteres(stockage, CONTRAINTES)).toBeUndefined();
  });

  it('ignore les champs inconnus au lieu de les recopier', () => {
    expect(criteresValides({ ...SAISIS, intrus: true }, CONTRAINTES)).toEqual(SAISIS);
  });
});
