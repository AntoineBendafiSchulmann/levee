import { describe, expect, it } from 'vitest';

import { DEMO_INITIAL_CRITERIA } from '../demo-data/criteria.demo';
import { DEMO_DEPARTURE_POINTS } from '../demo-data/departurePoints.demo';
import { DEMO_PLAYS } from '../demo-data/plays.demo';
import { availableDays } from '../domain/schedule';
import type { OutingCriteria } from '../domain/types';
import { CRITERIA_STORAGE_KEY, parseCriteria, writeCriteria, readCriteria, toStoredCriteria, type SessionStore } from './criteriaSessionStorage';

const CONSTRAINTS = { days: availableDays(DEMO_PLAYS), departurePoints: DEMO_DEPARTURE_POINTS };
const ENTERED: OutingCriteria = {
  ...DEMO_INITIAL_CRITERIA,
  day: '2026-11-28',
  departureMinutes: 960,
  exitLimitMinutes: 1310,
  genres: ['classique'],
  author: 'Marivaux',
  hideImpossible: true,
};

function storageOf(content: Record<string, string> = {}): SessionStore & { content: Record<string, string> } {
  return {
    content,
    getItem: (key) => content[key] ?? null,
    setItem: (key, value) => {
      content[key] = value;
    },
  };
}

const denied: SessionStore = {
  getItem: () => {
    throw new DOMException('refusé', 'SecurityError');
  },
  setItem: () => {
    throw new DOMException('plein', 'QuotaExceededError');
  },
};

describe('tab criteria memory', () => {
  it('reads back exactly the criteria written: Saturday 28, 4:00 pm, limit 9:50 pm', () => {
    const storage = storageOf();
    writeCriteria(storage, ENTERED);
    expect(Object.keys(storage.content)).toEqual([CRITERIA_STORAGE_KEY]);
    expect(readCriteria(storage, CONSTRAINTS)).toEqual(ENTERED);
  });

  it('persisted contract: reads back and rewrites identically the content captured from a tab', () => {
    const record =
      '{"jour":"2026-11-28","origine":"bastille","departMinutes":1110,"limiteMinutes":1320,"genres":["classique"],"auteur":"","masquerImpossibles":false}';
    const storage = storageOf({ [CRITERIA_STORAGE_KEY]: record });
    const criteria = readCriteria(storage, CONSTRAINTS);
    expect(criteria).toEqual({
      day: '2026-11-28',
      departurePointId: 'bastille',
      departureMinutes: 1110,
      exitLimitMinutes: 1320,
      genres: ['classique'],
      author: '',
      hideImpossible: false,
    });
    if (criteria !== undefined) {
      writeCriteria(storage, criteria);
    }
    expect(storage.content[CRITERIA_STORAGE_KEY]).toBe(record);
  });

  it('puts nothing in the address: only the storage key is used', () => {
    const storage = storageOf();
    writeCriteria(storage, ENTERED);
    expect(storage.content[CRITERIA_STORAGE_KEY]).toContain('"departMinutes":960');
  });

  it('no data: nothing to read back (the caller takes the initial criteria)', () => {
    expect(readCriteria(storageOf(), CONSTRAINTS)).toBeUndefined();
  });

  it('unreadable or malformed JSON: nothing to read back', () => {
    for (const raw of ['{pas du json', '', 'null', '42', '"texte"', '[]']) {
      expect(readCriteria(storageOf({ [CRITERIA_STORAGE_KEY]: raw }), CONSTRAINTS)).toBeUndefined();
    }
  });

  it('inaccessible or full storage: no read and no error thrown', () => {
    expect(readCriteria(denied, CONSTRAINTS)).toBeUndefined();
    expect(() => {
      writeCriteria(denied, ENTERED);
    }).not.toThrow();
    expect(readCriteria(undefined, CONSTRAINTS)).toBeUndefined();
    expect(() => {
      writeCriteria(undefined, ENTERED);
    }).not.toThrow();
  });
});

describe('readable JSON is accepted only if the domain accepts it', () => {
  const denial = (name: string, change: Record<string, unknown>) => {
    it(`rejects: ${name}`, () => {
      expect(parseCriteria({ ...toStoredCriteria(ENTERED), ...change }, CONSTRAINTS)).toBeNull();
    });
  };

  it('accepts complete criteria', () => {
    expect(parseCriteria(toStoredCriteria(ENTERED), CONSTRAINTS)).toEqual(ENTERED);
  });
  denial('unknown departure point', { origine: 'mars' });
  denial('unscheduled day', { jour: '2030-01-01' });
  denial('malformed day', { jour: 'samedi' });
  denial('departure that is not a multiple of 5 minutes', { departMinutes: 962 });
  denial('departure before the lower bound', { departMinutes: 955 });
  denial('departure after the upper bound', { departMinutes: 21 * 60 + 5 });
  denial('limit out of bounds', { limiteMinutes: 9999 });
  denial('negative minutes', { departMinutes: -60 });
  denial('decimal minutes', { limiteMinutes: 1310.5 });
  denial('minutes as text', { departMinutes: '960' });
  denial('non-finite minutes', { limiteMinutes: Number.NaN });
  denial('unknown genre', { genres: ['western'] });
  denial('duplicate genre', { genres: ['comedie', 'comedie'] });
  denial('genres that are not a list', { genres: 'comedie' });
  denial('author that is not text', { auteur: 12 });
  denial('hiding flag that is not a boolean', { masquerImpossibles: 'oui' });

  it('rejects a missing criterion', () => {
    const withoutAuthor: Record<string, unknown> = { ...toStoredCriteria(ENTERED) };
    delete withoutAuthor.auteur;
    expect(parseCriteria(withoutAuthor, CONSTRAINTS)).toBeNull();
  });

  it('a single rejected value discards everything: never half-restored criteria', () => {
    const storage = storageOf({ [CRITERIA_STORAGE_KEY]: JSON.stringify({ ...toStoredCriteria(ENTERED), origine: 'mars' }) });
    expect(readCriteria(storage, CONSTRAINTS)).toBeUndefined();
  });

  it('ignores unknown fields instead of copying them', () => {
    expect(parseCriteria({ ...toStoredCriteria(ENTERED), intrus: true }, CONSTRAINTS)).toEqual(ENTERED);
  });
});
