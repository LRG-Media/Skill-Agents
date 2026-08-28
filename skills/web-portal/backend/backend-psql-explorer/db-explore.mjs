#!/usr/bin/env node
/**
 * db-explore.mjs — Exploration complète d'une base PostgreSQL
 * 
 * Usage: node db-explore.mjs [portal]
 *   portal: nom du portail (défaut: lrgmedia)
 * 
 * Affiche: schemas, tables avec COUNT(*) réel, enums
 * Ne JAMAIS utiliser pg_stat_user_tables.n_live_tup (estimation obsolète)
 */

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

// --- Config ---
const portal = process.argv[2] || 'lrgmedia';
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

// --- Helpers ---
function pad(str, len) {
  return String(str).padEnd(len);
}

function padRight(str, len) {
  return String(str).padStart(len);
}

async function run() {
  await client.connect();

  console.log(`\n🗄️  Exploration de la base: ${url.pathname.slice(1)} (${portal})\n`);

  // 1. Schemas
  const schemas = await client.query(`
    SELECT n.nspname AS schema_name
    FROM pg_namespace n
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    ORDER BY n.nspname
  `);

  console.log(`📦 Schemas (${schemas.rows.length})`);
  console.log('─'.repeat(40));
  for (const s of schemas.rows) {
    console.log(`  • ${s.schema_name}`);
  }

  // 2. Tables avec COUNT(*) réel
  const tables = await client.query(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      AND table_type = 'BASE TABLE'
    ORDER BY table_schema, table_name
  `);

  console.log(`\n📋 Tables (${tables.rows.length})`);
  console.log('─'.repeat(60));
  console.log(`${pad('Table', 45)} ${padRight('Lignes', 10)}`);
  console.log('─'.repeat(60));

  let totalRows = 0;
  const schemaStats = {};

  for (const t of tables.rows) {
    const fullName = `${t.table_schema}.${t.table_name}`;
    try {
      const count = await client.query(`SELECT COUNT(*) AS cnt FROM ${fullName}`);
      const cnt = parseInt(count.rows[0].cnt);
      totalRows += cnt;

      if (!schemaStats[t.table_schema]) {
        schemaStats[t.table_schema] = { tables: 0, rows: 0 };
      }
      schemaStats[t.table_schema].tables++;
      schemaStats[t.table_schema].rows += cnt;

      console.log(`${pad(fullName, 45)} ${padRight(cnt.toLocaleString(), 10)}`);
    } catch (e) {
      console.log(`${pad(fullName, 45)} ${padRight('ERROR', 10)}`);
    }
  }

  console.log('─'.repeat(60));
  console.log(`${pad('TOTAL', 45)} ${padRight(totalRows.toLocaleString(), 10)}`);

  // 3. Résumé par schema
  console.log(`\n📊 Résumé par schema`);
  console.log('─'.repeat(50));
  console.log(`${pad('Schema', 20)} ${padRight('Tables', 8)} ${padRight('Lignes', 10)}`);
  console.log('─'.repeat(50));
  for (const [schema, stats] of Object.entries(schemaStats)) {
    console.log(`${pad(schema, 20)} ${padRight(stats.tables, 8)} ${padRight(stats.rows.toLocaleString(), 10)}`);
  }

  // 4. Enums
  const enums = await client.query(`
    SELECT t.typname, e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    ORDER BY t.typname, e.enumsortorder
  `);

  // Regrouper par type
  const enumMap = {};
  for (const row of enums.rows) {
    if (!enumMap[row.typname]) enumMap[row.typname] = [];
    enumMap[row.typname].push(row.enumlabel);
  }

  console.log(`\n🏷️  Enums (${Object.keys(enumMap).length})`);
  console.log('─'.repeat(60));
  for (const [name, values] of Object.entries(enumMap)) {
    console.log(`  ${name}: ${values.join(', ')}`);
  }

  await client.end();
  console.log('\n✅ Exploration terminée.\n');
}

run().catch(e => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
