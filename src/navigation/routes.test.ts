import { describe, expect, it } from 'vitest';

import { parseRoute, anchorFromUrl, pathForTarget, EVENING_ANCHOR_ID, defaultSource } from './routes';

describe('journey addresses', () => {
  it('recognises the home page, the results and the detail pages', () => {
    expect(parseRoute('/')).toEqual({ screen: 'home', target: null });
    expect(parseRoute('/seances')).toEqual({ screen: 'results', target: null });
    expect(parseRoute('/seances/')).toEqual({ screen: 'results', target: null });
    expect(parseRoute('/piece/jeu-amour-hasard')).toEqual({ screen: 'play', target: { type: 'play', id: 'jeu-amour-hasard' } });
    expect(parseRoute('/seances/jeu-amour-hasard-2026-11-28-1200')).toEqual({
      screen: 'play',
      target: { type: 'performance', id: 'jeu-amour-hasard-2026-11-28-1200' },
    });
  });

  it('falls back to the home page for an unknown or malformed address', () => {
    for (const path of ['/n-importe-quoi', '/piece', '/piece/a/b', '/seances/a/b', '/piece/%E0%A4%A']) {
      expect(parseRoute(path).screen).toBe('home');
    }
  });

  it('pathForTarget and parseRoute are inverses', () => {
    for (const target of [{ type: 'play', id: 'avare' }, { type: 'performance', id: 'avare-2026-11-28-1125' }] as const) {
      expect(parseRoute(pathForTarget(target)).target).toEqual(target);
    }
  });

  it('a detail page opened directly returns to its natural screen: performance → results, play → home', () => {
    expect(defaultSource(parseRoute('/seances/x'))).toBe('results');
    expect(defaultSource(parseRoute('/piece/x'))).toBe('home');
  });
});

describe('evening performances anchor', () => {
  it('the header address /#seances-du-soir requests the evening performances, and only on the home page', () => {
    expect(EVENING_ANCHOR_ID).toBe('seances-du-soir');
    expect(anchorFromUrl('/', '#seances-du-soir')).toBe('evening-performances');
    expect(anchorFromUrl('/seances', '#seances-du-soir')).toBeNull();
    expect(anchorFromUrl('/piece/avare', '#seances-du-soir')).toBeNull();
  });

  it('no anchor, or another anchor: nothing to do', () => {
    expect(anchorFromUrl('/', '')).toBeNull();
    expect(anchorFromUrl('/', '#autre')).toBeNull();
  });
});
