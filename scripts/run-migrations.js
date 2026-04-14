#!/usr/bin/env node
/**
 * Supabase Migration Runner
 *
 * Executes all SQL migration files in /supabase/migrations/ in order against
 * a Supabase project. Supports three connection methods (tried in order):
 *
 *   1. Direct PostgreSQL (via DATABASE_URL or derived from SUPABASE_URL)
 *   2. Supabase CLI  (supabase db query --linked, requires SUPABASE_ACCESS_TOKEN)
 *   3. Supabase Management API HTTP  (POST /v1/projects/{ref}/database/query)
 *
 * Required environment variables:
 *   SUPABASE_URL              - e.g. https://xyzxyz.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY - service_role JWT (also used as DB password)
 *
 * Optional:
 *   DATABASE_URL              - full postgres:// connection string (overrides derived URL)
 *   SUPABASE_ACCESS_TOKEN     - Supabase PAT for CLI/Management API approach
 *   SUPABASE_DB_PASSWORD      - Postgres DB password (if different from service_role key)
 *
 * Usage:
 *   node scripts/run-migrations.js
 *   node scripts/run-migrations.js --dry-run     (print SQL only, don't execute)
 *   node scripts/run-migrations.js --file 003    (run only migration matching "003")
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync, spawnSync } = require('child_process');

// ──────────────────────────────────────────────────────────────────────────────
// Load environment from .env files (no external deps)
// ──────────────────────────────────────────────────────────────────────────────
function loadEnvFile(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key && !(key in process.env)) {
        process.env[key] = val;
      }
    }
  } catch { /* file not present is fine */ }
}

loadEnvFile(path.join(__dirname, '..', '.env.local'));
loadEnvFile(path.join(__dirname, '..', '.env'));

// ──────────────────────────────────────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const DB_PASSWORD  = process.env.SUPABASE_DB_PASSWORD || SERVICE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

const DRY_RUN     = process.argv.includes('--dry-run');
const FILE_FILTER = (() => {
  const idx = process.argv.indexOf('--file');
  return idx !== -1 ? process.argv[idx + 1] : null;
})();

// ──────────────────────────────────────────────────────────────────────────────
// Derive project ref and DB connection string from Supabase URL
// ──────────────────────────────────────────────────────────────────────────────
function getProjectRef(url) {
  try {
    return new URL(url).hostname.split('.')[0];
  } catch { return null; }
}

function isLocalDev(url) {
  try {
    const u = new URL(url);
    return u.hostname === '127.0.0.1' || u.hostname === 'localhost';
  } catch { return false; }
}

function getDbConnectionString() {
  if (DATABASE_URL) return DATABASE_URL;
  if (!SUPABASE_URL) return null;

  if (isLocalDev(SUPABASE_URL)) {
    // Local Supabase defaults
    return 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
  }

  const ref = getProjectRef(SUPABASE_URL);
  if (!ref || !DB_PASSWORD) return null;

  // Supabase direct connection: postgres://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres
  // Or the pooler: postgresql://postgres.[ref]:[password]@aws-0-REGION.pooler.supabase.com:5432/postgres
  // The direct connection requires the actual database password (not service_role key in most setups)
  // Try direct DB connection first
  const encodedPwd = encodeURIComponent(DB_PASSWORD);
  return `postgresql://postgres.${ref}:${encodedPwd}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Method 1: Direct PostgreSQL via pg client
// ──────────────────────────────────────────────────────────────────────────────
async function runWithPg(sql) {
  let pg;
  try {
    pg = require('pg');
  } catch {
    return { success: false, error: 'pg module not available' };
  }

  const connStr = getDbConnectionString();
  if (!connStr) {
    return { success: false, error: 'Cannot derive database connection string' };
  }

  const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    await client.query(sql);
    await client.end();
    return { success: true };
  } catch (err) {
    try { await client.end(); } catch {}
    return { success: false, error: err.message };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Method 2: Supabase CLI  (supabase db query --linked)
// Requires SUPABASE_ACCESS_TOKEN and a linked project
// ──────────────────────────────────────────────────────────────────────────────
async function runWithCli(sqlFile) {
  try {
    execSync('which supabase', { stdio: 'ignore' });
  } catch {
    return { success: false, error: 'supabase CLI not found in PATH' };
  }

  if (!ACCESS_TOKEN) {
    return { success: false, error: 'SUPABASE_ACCESS_TOKEN not set (required for CLI --linked)' };
  }

  const env = { ...process.env, SUPABASE_ACCESS_TOKEN: ACCESS_TOKEN };
  const result = spawnSync('supabase', ['db', 'query', '--linked', '-f', sqlFile], {
    env,
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    timeout: 120000,
  });

  if (result.status === 0) {
    return { success: true, output: result.stdout };
  }
  return {
    success: false,
    error: (result.stderr || result.stdout || '').trim().slice(0, 800),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Method 3: Supabase Management API  POST /v1/projects/{ref}/database/query
// Requires a Supabase Personal Access Token (PAT) — NOT the service_role key
// ──────────────────────────────────────────────────────────────────────────────
function httpRequest(options, body) {
  const transport = options.protocol === 'http:' ? http : https;
  return new Promise((resolve, reject) => {
    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.setTimeout(60000, () => { req.destroy(new Error('Request timed out')); });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runWithManagementApi(sql) {
  const token = ACCESS_TOKEN || SERVICE_KEY;
  if (!token) {
    return { success: false, error: 'No token available for Management API' };
  }

  const ref = SUPABASE_URL ? getProjectRef(SUPABASE_URL) : null;
  if (!ref || isLocalDev(SUPABASE_URL)) {
    return { success: false, error: 'Management API requires a remote Supabase project URL' };
  }

  const body = JSON.stringify({ query: sql });
  const resp = await httpRequest({
    protocol: 'https:',
    hostname: 'api.supabase.com',
    path: `/v1/projects/${ref}/database/query`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': Buffer.byteLength(body),
    },
  }, body);

  if (resp.status >= 200 && resp.status < 300) {
    return { success: true, output: resp.body };
  }

  const errBody = resp.body.toLowerCase();
  const isIdempotent = [
    'already exists', 'duplicate key', 'type already exists',
    'function already exists', 'index already exists', 'trigger already exists',
    'extension already exists', 'policy already exists',
  ].some(s => errBody.includes(s));

  if (isIdempotent) {
    return { success: true, output: `(idempotent — objects already exist)` };
  }

  return {
    success: false,
    error: `HTTP ${resp.status}: ${resp.body.slice(0, 800)}`,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Runner
// ──────────────────────────────────────────────────────────────────────────────
async function runMigration(filename, sql) {
  const filepath = path.join(__dirname, '..', 'supabase', 'migrations', filename);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Migration: ${filename}`);
  console.log('='.repeat(60));

  if (DRY_RUN) {
    console.log('[DRY RUN] SQL preview:');
    const preview = sql.split('\n').slice(0, 12).join('\n');
    console.log(preview);
    if (sql.split('\n').length > 12) console.log('... (truncated)');
    return true;
  }

  // Try methods in order
  const methods = [
    { name: 'PostgreSQL direct (pg)', fn: () => runWithPg(sql) },
    { name: 'Supabase CLI (--linked)', fn: () => runWithCli(filepath) },
    { name: 'Management API', fn: () => runWithManagementApi(sql) },
  ];

  for (const { name, fn } of methods) {
    process.stdout.write(`  Trying ${name}... `);
    try {
      const result = await fn();
      if (result.success) {
        console.log('SUCCESS');
        if (result.output && result.output.trim()) {
          console.log('  Output:', result.output.trim().slice(0, 300));
        }
        return true;
      } else {
        console.log(`SKIPPED (${result.error})`);
      }
    } catch (err) {
      console.log(`ERROR (${err.message})`);
    }
  }

  console.error(`FAILED: all methods exhausted for ${filename}`);
  return false;
}

function getMigrationFiles() {
  const dir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  return FILE_FILTER ? files.filter(f => f.includes(FILE_FILTER)) : files;
}

async function main() {
  console.log('Supabase Migration Runner');
  console.log('='.repeat(60));
  console.log(`SUPABASE_URL:   ${SUPABASE_URL || 'NOT SET'}`);
  console.log(`SERVICE_KEY:    ${SERVICE_KEY ? '[REDACTED]' : 'NOT SET'}`);
  console.log(`ACCESS_TOKEN:   ${ACCESS_TOKEN ? '[REDACTED]' : 'NOT SET'}`);
  console.log(`DATABASE_URL:   ${DATABASE_URL || '(derived)'}`);
  console.log(`Dry run:        ${DRY_RUN}`);
  console.log(`File filter:    ${FILE_FILTER || 'all'}`);

  if (!SUPABASE_URL && !DATABASE_URL) {
    console.error('\nERROR: SUPABASE_URL (or DATABASE_URL) must be set.');
    console.error('Set it as an environment variable or in .env.local');
    process.exit(1);
  }

  const files = getMigrationFiles();
  console.log(`\nMigrations to run (${files.length}):`);
  files.forEach(f => console.log(`  - ${f}`));

  if (files.length === 0) {
    console.log('No migration files found.');
    process.exit(0);
  }

  const results = [];
  let allPassed = true;

  for (const filename of files) {
    const sql = fs.readFileSync(
      path.join(__dirname, '..', 'supabase', 'migrations', filename),
      'utf8',
    );
    const ok = await runMigration(filename, sql);
    results.push({ filename, success: ok });
    if (!ok) { allPassed = false; break; }
  }

  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(60));
  for (const { filename, success } of results) {
    const ran = results.some(r => r.filename === filename);
    console.log(`  ${success ? 'PASS' : 'FAIL'}  ${filename}`);
  }

  const pending = files.filter(f => !results.some(r => r.filename === f));
  for (const f of pending) {
    console.log(`  SKIP  ${f}  (not reached due to earlier failure)`);
  }

  if (allPassed && results.length === files.length) {
    console.log('\nAll migrations completed successfully.');
    process.exit(0);
  } else {
    console.log('\nSome migrations failed or were skipped.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
