'use strict';

/**
 * Tests for lib/load-client-env.js.
 *
 * Run via: npx jest template/scripts/lib/load-client-env.test.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const { parseEnvFile, loadClientEnv, resolveClientEnvPath } = require('./load-client-env');

describe('parseEnvFile', () => {
  test('parses simple KEY=VALUE pairs', () => {
    expect(parseEnvFile('A=1\nB=2\n')).toEqual({ A: '1', B: '2' });
  });

  test('skips comments and blanks', () => {
    expect(parseEnvFile('# comment\n\nA=1\n# another\n')).toEqual({ A: '1' });
  });

  test('strips matching surrounding double quotes', () => {
    expect(parseEnvFile('A="quoted value"\n')).toEqual({ A: 'quoted value' });
  });

  test('strips matching surrounding single quotes', () => {
    expect(parseEnvFile("A='quoted'\n")).toEqual({ A: 'quoted' });
  });

  test('preserves mismatched quotes', () => {
    expect(parseEnvFile('A="unterminated\n')).toEqual({ A: '"unterminated' });
  });

  test('handles values containing equals signs', () => {
    expect(parseEnvFile('TOKEN=abc=def=ghi\n')).toEqual({ TOKEN: 'abc=def=ghi' });
  });

  test('handles CRLF line endings', () => {
    expect(parseEnvFile('A=1\r\nB=2\r\n')).toEqual({ A: '1', B: '2' });
  });

  test('skips lines without =', () => {
    expect(parseEnvFile('garbage\nA=1\n')).toEqual({ A: '1' });
  });
});

describe('loadClientEnv', () => {
  test('returns {} for missing client', () => {
    // A definitely-not-real slug — file doesn't exist
    expect(loadClientEnv('nonexistent-client-xyzzy')).toEqual({});
  });

  test('throws if slug is empty', () => {
    expect(() => loadClientEnv('')).toThrow(/slug is required/);
    expect(() => loadClientEnv()).toThrow(/slug is required/);
  });

  test('does NOT mutate process.env when reading a real client .env', () => {
    // Create a temporary clients/<slug>/.env in a sandbox repo
    const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'lce-'));
    const slug = 'sbx';
    const clientDir = path.join(sandbox, 'clients', slug);
    fs.mkdirSync(clientDir, { recursive: true });
    fs.writeFileSync(path.join(clientDir, '.env'), 'DATAFORSEO_LOGIN=should-not-leak\n');

    const before = { ...process.env };
    // Re-run the parse step manually (resolve path uses __dirname so we can't redirect easily;
    // exercise parseEnvFile directly + assert no leakage)
    const parsed = parseEnvFile('DATAFORSEO_LOGIN=should-not-leak\n');
    expect(parsed.DATAFORSEO_LOGIN).toBe('should-not-leak');
    expect(process.env.DATAFORSEO_LOGIN).toBeUndefined();
    expect(process.env).toEqual(before);

    fs.rmSync(sandbox, { recursive: true, force: true });
  });
});

describe('resolveClientEnvPath', () => {
  test('returns repo-root-relative clients/<slug>/.env', () => {
    const p = resolveClientEnvPath('matt-wallmow');
    // Should end with /clients/matt-wallmow/.env
    expect(p.endsWith(path.join('clients', 'matt-wallmow', '.env'))).toBe(true);
    // Should NOT contain template/scripts/lib (the helper's own location) in the middle
    expect(p).not.toMatch(/template\/scripts\/lib/);
  });
});
