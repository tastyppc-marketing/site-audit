'use strict';

/**
 * fetch-with-retry.js — Shared retry utility for all gather-*.js scripts.
 *
 * Features:
 *   - Concurrency limiter (Semaphore, default max 2)
 *   - Exponential backoff on 429 / 5xx (2s -> 4s -> 8s -> 16s -> 32s -> 60s cap)
 *   - Max 5 retries per request
 *   - Supports both GET and POST (with JSON body)
 *   - Progress logging
 *
 * Usage:
 *   const { fetchJSON, Semaphore } = require('./lib/fetch-with-retry');
 *
 *   const data = await fetchJSON('https://api.example.com/endpoint');
 *
 *   const data = await fetchJSON('https://api.example.com/endpoint', {
 *     method: 'POST',
 *     body: [{ keyword: 'test' }],
 *     auth: 'user:pass',
 *   });
 *
 *   const sem = new Semaphore(2);
 *   const results = await Promise.all(urls.map(url =>
 *     sem.run(() => fetchJSON(url))
 *   ));
 */

const https = require('https');
const http = require('http');

// ---------------------------------------------------------------------------
// Request stats tracker — collects metrics across all requests in a process
// ---------------------------------------------------------------------------
const stats = {
  totalRequests: 0,
  successes: 0,
  failures: 0,
  retries: 0,
  totalBytes: 0,
  startTime: Date.now(),
  byStatus: {},
};

function ts() {
  return new Date().toISOString().replace('T', ' ').substring(0, 23);
}

function logRequest(method, url, attempt, statusCode, bodySize, elapsedMs, retrying) {
  const status = retrying ? 'RETRY' : (statusCode < 400 ? 'OK' : 'FAIL');
  const sizeStr = bodySize > 1024 ? (bodySize / 1024).toFixed(1) + 'KB' : bodySize + 'B';
  console.log('  [' + ts() + '] ' + method + ' ' + status + ' ' + statusCode + ' ' + sizeStr + ' ' + elapsedMs + 'ms ' + (attempt > 0 ? '(attempt ' + (attempt + 1) + ') ' : '') + url.substring(0, 100));
}

function printSummary() {
  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  console.log('\n--- fetch-with-retry summary ---');
  console.log('  Total requests: ' + stats.totalRequests);
  console.log('  Successes: ' + stats.successes);
  console.log('  Failures: ' + stats.failures);
  console.log('  Retries: ' + stats.retries);
  console.log('  Total data: ' + (stats.totalBytes / 1024).toFixed(1) + 'KB');
  console.log('  Elapsed: ' + elapsed + 's');
  if (Object.keys(stats.byStatus).length > 0) {
    console.log('  Status codes: ' + JSON.stringify(stats.byStatus));
  }
  console.log('-------------------------------\n');
}

// Auto-print summary on process exit
process.on('beforeExit', printSummary);

// ---------------------------------------------------------------------------
// Semaphore — limits concurrent in-flight requests
// ---------------------------------------------------------------------------
class Semaphore {
  constructor(max = 2) {
    this.max = max;
    this.active = 0;
    this.queue = [];
  }

  async run(fn) {
    while (this.active >= this.max) {
      await new Promise(resolve => this.queue.push(resolve));
    }
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      if (this.queue.length > 0) {
        this.queue.shift()();
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Core: single HTTP(S) request as a Promise
// ---------------------------------------------------------------------------
function rawRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const mod = isHttps ? https : http;

    const method = (options.method || 'GET').toUpperCase();
    const bodyStr = options.body != null ? JSON.stringify(options.body) : null;

    const headers = Object.assign(
      { 'Accept': 'application/json' },
      options.headers || {}
    );

    if (bodyStr) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    if (options.auth) {
      headers['Authorization'] = 'Basic ' + Buffer.from(options.auth).toString('base64');
    }

    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers,
      timeout: options.timeout || 60000,
    };

    const req = mod.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout after ' + reqOptions.timeout + 'ms: ' + url));
    });

    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Retry wrapper with exponential backoff
// ---------------------------------------------------------------------------
const DEFAULT_MAX_RETRIES = 5;
const BACKOFF_BASE_MS = 2000;
const BACKOFF_CAP_MS = 60000;

function isRetryable(statusCode) {
  return statusCode === 429 || (statusCode >= 500 && statusCode < 600);
}

function backoffMs(attempt) {
  const ms = BACKOFF_BASE_MS * Math.pow(2, attempt);
  return Math.min(ms, BACKOFF_CAP_MS);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * fetchWithRetry — HTTP(S) request with automatic retry on 429/5xx.
 */
async function fetchWithRetry(url, options = {}) {
  const maxRetries = options.maxRetries != null ? options.maxRetries : DEFAULT_MAX_RETRIES;
  const label = options.label || url.substring(0, 80);
  const method = (options.method || 'GET').toUpperCase();

  stats.totalRequests++;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const t0 = Date.now();
    try {
      const res = await rawRequest(url, options);
      const elapsedMs = Date.now() - t0;
      const bodySize = res.body ? res.body.length : 0;

      stats.byStatus[res.statusCode] = (stats.byStatus[res.statusCode] || 0) + 1;
      stats.totalBytes += bodySize;

      if (isRetryable(res.statusCode) && attempt < maxRetries) {
        const wait = backoffMs(attempt);
        stats.retries++;
        logRequest(method, label, attempt, res.statusCode, bodySize, elapsedMs, true);
        console.log('  [RETRY ' + (attempt + 1) + '/' + maxRetries + '] ' + res.statusCode + ' on ' + label + '. Waiting ' + (wait / 1000).toFixed(0) + 's...');
        await sleep(wait);
        continue;
      }

      logRequest(method, label, attempt, res.statusCode, bodySize, elapsedMs, false);
      if (res.statusCode < 400) stats.successes++;
      else stats.failures++;

      return res;
    } catch (err) {
      const elapsedMs = Date.now() - t0;
      if (attempt < maxRetries) {
        const wait = backoffMs(attempt);
        stats.retries++;
        console.log('  [' + ts() + '] ' + method + ' ERROR ' + err.message.substring(0, 80) + ' ' + elapsedMs + 'ms (attempt ' + (attempt + 1) + ') ' + label);
        console.log('  [RETRY ' + (attempt + 1) + '/' + maxRetries + '] ' + err.message.substring(0, 60) + ' on ' + label + '. Waiting ' + (wait / 1000).toFixed(0) + 's...');
        await sleep(wait);
        continue;
      }
      stats.failures++;
      console.log('  [' + ts() + '] ' + method + ' FATAL ' + err.message.substring(0, 80) + ' ' + elapsedMs + 'ms (exhausted ' + maxRetries + ' retries) ' + label);
      throw err;
    }
  }
}

/**
 * fetchJSON — convenience wrapper that parses JSON response body.
 * Throws on non-2xx (after retries exhausted) unless options.allowNon2xx is set.
 */
async function fetchJSON(url, options = {}) {
  const res = await fetchWithRetry(url, options);

  if (res.statusCode >= 400 && !options.allowNon2xx) {
    const err = new Error('HTTP ' + res.statusCode + ': ' + url + '\n' + res.body.substring(0, 500));
    err.statusCode = res.statusCode;
    err.responseBody = res.body;
    throw err;
  }

  try {
    return JSON.parse(res.body);
  } catch (e) {
    const err = new Error('Invalid JSON from ' + url + ': ' + e.message + '\n' + res.body.substring(0, 200));
    err.statusCode = res.statusCode;
    err.responseBody = res.body;
    throw err;
  }
}

/**
 * postJson — POST convenience wrapper for DFS-style APIs.
 * Sends JSON body, returns { statusCode, headers, body (parsed JSON) }.
 */
async function postJson(url, payload, options = {}) {
  const res = await fetchWithRetry(url, Object.assign({}, options, {
    method: 'POST',
    body: payload,
  }));
  let body;
  try {
    body = JSON.parse(res.body);
  } catch (e) {
    body = res.body;
  }
  return { statusCode: res.statusCode, headers: res.headers, body };
}

/**
 * requestJson — GET convenience wrapper. Returns { statusCode, headers, body (parsed JSON) }.
 */
async function requestJson(url, options = {}) {
  const res = await fetchWithRetry(url, Object.assign({}, options, { method: 'GET' }));
  let body;
  try {
    body = JSON.parse(res.body);
  } catch (e) {
    body = res.body;
  }
  return { statusCode: res.statusCode, headers: res.headers, body };
}

/**
 * requestText — GET convenience wrapper. Returns raw text body (no JSON parsing).
 */
async function requestText(url, options = {}) {
  const res = await fetchWithRetry(url, Object.assign({}, options, { method: 'GET' }));
  return res.body;
}

module.exports = {
  fetchWithRetry, fetchJSON, rawRequest, Semaphore, sleep, isRetryable,
  postJson, requestJson, requestText,
};
