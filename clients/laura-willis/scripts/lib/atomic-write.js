'use strict';

/**
 * atomic-write.js — Atomic, backed-up JSON writer for pipeline data files.
 *
 * Guarantees: a crash, signal, or concurrent write cannot leave the target
 * in a partial/invalid state. The prior version is preserved in a fixed
 * `${target}.bak` for recovery.
 *
 * Flow:
 *   1. If target exists, copy it to `${target}.bak` (overwrites any prior .bak).
 *   2. Write JSON to `${target}.tmp-<pid>-<ts>` and fsync the fd.
 *   3. fs.renameSync(tmp, target) — POSIX atomic within a filesystem.
 *
 * On any throw between (1) and (3): target bytes are untouched, .bak is
 * preserved, and the .tmp file is best-effort unlinked.
 *
 * Usage:
 *   const { writeJsonAtomic } = require('./lib/atomic-write');
 *   writeJsonAtomic('seo/audit-data.json', data, { indent: 2 });
 *   writeJsonAtomic('seo/audit-data.json', data, { indent: 2, trailingNewline: true });
 */

const fs = require('fs');
const path = require('path');

/**
 * Write `value` as JSON to `target` atomically, with a `.bak` of the prior
 * file preserved on disk.
 *
 * @param {string} target - Absolute or relative path to the final file.
 * @param {*} value - Any JSON-serializable value.
 * @param {{ indent?: number, trailingNewline?: boolean }} [options]
 */
function writeJsonAtomic(target, value, options) {
  const opts = options || {};
  const indent = opts.indent == null ? 2 : opts.indent;
  const trailingNewline = opts.trailingNewline === true;

  const targetAbs = path.resolve(target);
  const bakPath = targetAbs + '.bak';
  const tmpPath = targetAbs + '.tmp-' + process.pid + '-' + Date.now();

  let serialized = JSON.stringify(value, null, indent);
  if (trailingNewline) serialized += '\n';

  // 1. Back up prior version if present.
  if (fs.existsSync(targetAbs)) {
    fs.copyFileSync(targetAbs, bakPath);
  }

  // 2. Write tmp + fsync.
  let fd;
  try {
    fd = fs.openSync(tmpPath, 'w');
    fs.writeSync(fd, serialized);
    fs.fsyncSync(fd);
  } catch (err) {
    try { if (fd != null) fs.closeSync(fd); } catch (_) { /* noop */ }
    try { fs.unlinkSync(tmpPath); } catch (_) { /* noop */ }
    throw err;
  }
  fs.closeSync(fd);

  // 3. Atomic rename.
  try {
    fs.renameSync(tmpPath, targetAbs);
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch (_) { /* noop */ }
    throw err;
  }
}

module.exports = { writeJsonAtomic };
