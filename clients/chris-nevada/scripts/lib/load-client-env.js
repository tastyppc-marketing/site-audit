'use strict';

/**
 * load-client-env.js — explicit per-client env loader.
 *
 * Reads clients/<slug>/.env into a returned object WITHOUT mutating
 * process.env. Closes the unsafe cd-coupled flow where gather scripts
 * read `process.env.DATAFORSEO_LOGIN` and silently picked up whatever
 * .env happened to be in the current working directory.
 *
 * Path resolution: walks 3 levels up from __dirname to reach the repo
 * root, then drops into clients/<slug>/.env. This works from both
 * template/scripts/lib/ (development) and clients/<slug>/scripts/lib/
 * (post-Step-1.5 client clone) because both directories sit exactly
 * 3 levels below the repo root.
 *
 * Usage:
 *   const { loadClientEnv } = require('./lib/load-client-env');
 *   const env = loadClientEnv('matt-wallmow');
 *   const login = env.DATAFORSEO_LOGIN;
 *
 * @param {string} slug - client directory name under clients/
 * @returns {Object<string,string>} parsed env values; empty object if file is missing
 * @throws {Error} only on filesystem read errors (not on missing file)
 */

const fs = require('fs');
const path = require('path');

function parseEnvFile(text) {
  const result = {};
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (!key) continue;
    let value = line.slice(eq + 1).trim();
    // Strip surrounding double or single quotes if balanced
    if (value.length >= 2) {
      const first = value[0];
      const last = value[value.length - 1];
      if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        value = value.slice(1, -1);
      }
    }
    result[key] = value;
  }
  return result;
}

function resolveClientEnvPath(slug) {
  if (typeof slug !== 'string' || !slug) {
    throw new Error('loadClientEnv: slug is required');
  }
  // __dirname is .../template/scripts/lib OR .../clients/<slug>/scripts/lib
  // Both sit 3 levels below repo root.
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  return path.join(repoRoot, 'clients', slug, '.env');
}

function loadClientEnv(slug) {
  const envPath = resolveClientEnvPath(slug);
  if (!fs.existsSync(envPath)) {
    return {};
  }
  const content = fs.readFileSync(envPath, 'utf8');
  return parseEnvFile(content);
}

/**
 * Resolve the active client slug.
 *
 * Looks for `--client-slug <slug>` in argv first; falls back to the
 * basename of process.cwd() (legacy `cd clients/<slug>` flow).
 *
 * @param {string[]} [argv=process.argv] - argv array including node + script path
 * @returns {string} client slug
 */
function resolveClientSlug(argv) {
  const a = argv || process.argv;
  const idx = a.indexOf('--client-slug');
  if (idx !== -1 && a[idx + 1]) {
    return a[idx + 1];
  }
  return path.basename(process.cwd());
}

module.exports = { loadClientEnv, parseEnvFile, resolveClientEnvPath, resolveClientSlug };
