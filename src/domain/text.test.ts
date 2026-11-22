import { describe, expect, it } from 'vitest';

import { normalizeText, pluralize } from './text';

describe('text', () => {
  it('pluralizes from 2', () => {
    expect(pluralize(0, 'séance', 'séances')).toBe('0 séance');
    expect(pluralize(1, 'séance', 'séances')).toBe('1 séance');
    expect(pluralize(2, 'séance', 'séances')).toBe('2 séances');
  });

  it('normalizes accents, case and spaces', () => {
    expect(normalizeText('  Molière ')).toBe('moliere');
    expect(normalizeText('ÉDMOND')).toBe('edmond');
  });
});
