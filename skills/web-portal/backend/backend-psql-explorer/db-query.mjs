#!/usr/bin/env node
/**
 * db-query.mjs — Exécuter une requête SQL
 * 
 * Usage: node db-query.mjs [flags] [portal] <sql>
 *   portal: nom du portail (défaut: lrgmedia)
 *   sql: requête SQL
 * 
 * Sécurité: bloque les écritures par défaut, utiliser --write pour autoriser.
 * Limite auto: ajoute LIMIT 200 si absent (pour SELECT, sauf --no-limit)
 */

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

// --- Parse flags & args ---
const rawArgs = process.argv.slice(2);
const flags = new Set();
const flagValues = {};
const consumed = new Set(); // track indices consumed by flag values

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg.startsWith('--')) {
    flags.add(arg);
    if ((arg === '--output' || arg === '--format') && rawArgs[i + 1] && !rawArgs[i + 1].startsWith('--')) {
      flagValues[arg.slice(2)] = rawArgs[i + 1];
      consumed.add(i + 1);
      i++; // skip the value arg
    }
  }
}

const positionalArgs = rawArgs.filter((a, idx) => !a.startsWith('--') && !consumed.has(idx));

let portal, sql;
if (positionalArgs.length >= 2) {
  portal = positionalArgs[0];
  sql = positionalArgs.slice(1).join(' ');
} else if (positionalArgs.length === 1) {
  portal = 'lrgmedia';
  sql = positionalArgs[0];
} else {
  console.error('Usage: node db-query.mjs [flags] [portal] <sql>');
  console.error('');
  console.error('Flags:');
  console.error('  --write        Autoriser les requêtes d\'écriture (DELETE, UPDATE, etc.)');
  console.error('  --confirm      Demander confirmation avant exécution destructive');
  console.error('  --dry-run      Afficher la requête sans l\'exécuter');
  console.error('  --no-limit     Ne pas ajouter LIMIT 200 automatiquement');
  console.error('  --output <f>   Exporter les résultats en JSON vers un fichier');
  console.error('  --format <f>   Format: table (défaut), json, csv');
  console.error('');
  console.error('Exemples:');
  console.error('  node db-query.mjs lrgmedia "SELECT * FROM crm.contacts LIMIT 10"');
  console.error('  node db-query.mjs --format json lrgmedia "SELECT * FROM crm.contacts LIMIT 10"');
  console.error('  node db-query.mjs --write --confirm lrgmedia "DELETE FROM finance.subscriptions WHERE id = 40"');
  console.error('  node db-query.mjs --write --dry-run lrgmedia "DELETE FROM finance.subscriptions WHERE id = 40"');
  process.exit(1);
}

if (!sql || sql.trim() === '') {
  console.error('❌ Requête SQL requise');
  process.exit(1);
}

// --- Sécurité: détection requêtes d'écriture ---
const WRITE_KEYWORDS = /^\s*(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE|EXECUTE|COPY)\b/i;
const isWriteQuery = WRITE_KEYWORDS.test(sql);

if (isWriteQuery && !flags.has('--write')) {
  console.error('❌ REQUÊTE INTERDITE: Seules les requêtes SELECT/WITH/EXPLAIN sont autorisées sans --write.');
  console.error(`   Requête rejetée: ${sql.substring(0, 80)}...`);
  console.error('   Ajoutez --write pour autoriser les écritures.');
  process.exit(1);
}

// --- Confirmation pour requêtes destructives ---
const DESTRUCTIVE = /^\s*(DELETE|DROP|TRUNCATE)\b/i;
const isDestructive = DESTRUCTIVE.test(sql);

if (flags.has('--write') && isDestructive && flags.has('--confirm')) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise(resolve => {
    rl.question(`⚠️  REQUÊTE DESTRUCTIVE:\n   ${sql.substring(0, 120)}\n\n   Confirmer ? (oui/non) `, resolve);
  });
  rl.close();
  if (!['oui', 'o', 'yes', 'y'].includes(answer.toLowerCase().trim())) {
    console.log('❌ Annulé.');
    process.exit(0);
  }
}

// --- Dry run ---
if (flags.has('--dry-run')) {
  console.log(`\n🔒 DRY RUN — Requête qui serait exécutée:`);
  console.log(`   ${sql}`);
  if (isWriteQuery) {
    console.log(`   Type: écriture ${isDestructive ? '(DESTRUCTIVE ⚠️)' : ''}`);
  }
  process.exit(0);
}

// --- Sécurité: ajout LIMIT si absent ---
const isSelect = /^\s*(SELECT|WITH)\b/i.test(sql);
const hasLimit = /\bLIMIT\s+\d+/i.test(sql);
const isExplain = /^\s*EXPLAIN\b/i.test(sql);

if (isSelect && !hasLimit && !isExplain && !flags.has('--no-limit')) {
  sql = sql.trim().replace(/;$/, '') + ' LIMIT 200';
}

// --- Config ---
const configPath = path.join(PROJECT_ROOT, 'portal-configs', `${portal}.json`);
if (!fs.existsSync(configPath)) {
  console.error(`❌ Portal config not found: ${configPath}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const dbUrl = config.security?.database_config?.development;
if (!dbUrl) {
  console.error('❌ No database URL found in config');
  process.exit(1);
}

const url = new URL(dbUrl);
const client = new Client({
  host: url.hostname,
  port: parseInt(url.port) || 5432,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
});

function formatCSV(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => {
      const val = row[h] === null ? '' : String(row[h]);
      return val.includes(',') || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(','));
  }
  return lines.join('\n');
}

async function run() {
  await client.connect();

  console.log(`\n📊 Exécution sur ${url.pathname.slice(1)} (${portal})`);
  console.log(`📝 ${sql}\n`);

  const start = Date.now();
  const result = await client.query(sql);
  const elapsed = Date.now() - start;
  const fmt = flagValues.format || 'table';

  // Output to file
  if (flagValues.output) {
    fs.writeFileSync(flagValues.output, JSON.stringify(result.rows, null, 2));
    console.log(`✅ ${result.rows.length} ligne(s) exportées vers ${flagValues.output}`);
  }

  if (result.rows && result.rows.length > 0) {
    if (fmt === 'json') {
      console.log(JSON.stringify(result.rows, null, 2));
    } else if (fmt === 'csv') {
      console.log(formatCSV(result.rows));
    } else {
      // Default: table
      if (result.rows.length <= 50) {
        console.table(result.rows);
      } else {
        console.log(JSON.stringify(result.rows, null, 2));
      }
    }
    console.log(`\n✅ ${result.rows.length} ligne(s) en ${elapsed}ms`);
  } else if (result.command) {
    console.log(`✅ ${result.command} exécuté en ${elapsed}ms`);
  } else {
    console.log('✅ Aucun résultat');
  }

  await client.end();
}

run().catch(e => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
