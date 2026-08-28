#!/usr/bin/env node
/**
 * db-inspect.mjs — Inspection détaillée d'une table
 * 
 * Usage: node db-inspect.mjs [portal] <schema.table>
 *   portal: nom du portail (défaut: lrgmedia)
 *   schema.table: table à inspecter (ex: crm.accounts, finance.invoices)
 * 
 * Affiche: colonnes, types, FK, indexes, triggers, RLS, 5 échantillons
 */

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

// --- Args ---
let portal, tableRef;
if (process.argv.length >= 4) {
  portal = process.argv[2];
  tableRef = process.argv[3];
} else if (process.argv.length === 3) {
  portal = 'lrgmedia';
  tableRef = process.argv[2];
} else {
  console.error('Usage: node db-inspect.mjs [portal] <schema.table>');
  console.error('  ex: node db-inspect.mjs lrgmedia crm.accounts');
  process.exit(1);
}

const parts = tableRef.split('.');
if (parts.length !== 2) {
  console.error('❌ Format requis: schema.table (ex: crm.accounts)');
  process.exit(1);
}
const [schema, table] = parts;

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

function pad(str, len) { return String(str).padEnd(len); }
function padRight(str, len) { return String(str).padStart(len); }

async function run() {
  await client.connect();

  console.log(`\n🔍 Inspection de ${schema}.${table} (${portal})\n`);

  // 1. Colonnes
  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default,
           character_maximum_length, numeric_precision
    FROM information_schema.columns
    WHERE table_schema = $1 AND table_name = $2
    ORDER BY ordinal_position
  `, [schema, table]);

  if (cols.rows.length === 0) {
    console.error(`❌ Table ${schema}.${table} non trouvée`);
    await client.end();
    process.exit(1);
  }

  console.log(`📦 Colonnes (${cols.rows.length})`);
  console.log('─'.repeat(70));
  console.log(`${pad('Colonne', 25)} ${pad('Type', 20)} ${pad('Nullable', 10)} ${pad('Défaut', 15)}`);
  console.log('─'.repeat(70));
  for (const c of cols.rows) {
    const type = c.character_maximum_length
      ? `${c.data_type}(${c.character_maximum_length})`
      : c.data_type;
    console.log(`${pad(c.column_name, 25)} ${pad(type, 20)} ${pad(c.is_nullable, 10)} ${pad(c.column_default || '', 15)}`);
  }

  // 2. Count
  const count = await client.query(`SELECT COUNT(*) AS cnt FROM ${schema}.${table}`);
  console.log(`\n📊 Total: ${parseInt(count.rows[0].cnt).toLocaleString()} lignes`);

  // 3. Foreign Keys
  const fks = await client.query(`
    SELECT
      kcu.column_name,
      ccu.table_schema AS foreign_schema,
      ccu.table_name AS foreign_table,
      ccu.column_name AS foreign_column,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = $1
      AND tc.table_name = $2
  `, [schema, table]);

  console.log(`\n🔗 Foreign Keys (${fks.rows.length})`);
  console.log('─'.repeat(70));
  if (fks.rows.length > 0) {
    console.log(`${pad('Colonne', 20)} → ${pad('Table cible', 30)} ${pad('Colonne cible', 20)}`);
    console.log('─'.repeat(70));
    for (const fk of fks.rows) {
      console.log(`${pad(fk.column_name, 20)} → ${pad(`${fk.foreign_schema}.${fk.foreign_table}`, 30)} ${pad(fk.foreign_column, 20)}`);
    }
  } else {
    console.log('  (aucune)');
  }

  // 4. Indexes
  const indexes = await client.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = $1 AND tablename = $2
  `, [schema, table]);

  console.log(`\n📇 Indexes (${indexes.rows.length})`);
  console.log('─'.repeat(70));
  if (indexes.rows.length > 0) {
    for (const idx of indexes.rows) {
      console.log(`  • ${idx.indexname}`);
      console.log(`    ${idx.indexdef}`);
    }
  } else {
    console.log('  (aucun)');
  }

  // 5. Constraints (PK, UNIQUE, CHECK)
  const constraints = await client.query(`
    SELECT conname, contype, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid = $1::regclass
      AND contype IN ('p', 'u', 'c')
  `, [`${schema}.${table}`]);

  const typeLabels = { p: 'PRIMARY KEY', u: 'UNIQUE', c: 'CHECK' };
  console.log(`\n🔒 Constraints (${constraints.rows.length})`);
  console.log('─'.repeat(70));
  if (constraints.rows.length > 0) {
    for (const c of constraints.rows) {
      console.log(`  • ${typeLabels[c.contype] || c.contype}: ${c.conname}`);
      console.log(`    ${c.def}`);
    }
  } else {
    console.log('  (aucune)');
  }

  // 6. Triggers
  const triggers = await client.query(`
    SELECT trigger_name, event_manipulation, action_timing, action_statement
    FROM information_schema.triggers
    WHERE event_object_schema = $1 AND event_object_table = $2
  `, [schema, table]);

  console.log(`\n⚡ Triggers (${triggers.rows.length})`);
  console.log('─'.repeat(70));
  if (triggers.rows.length > 0) {
    for (const tr of triggers.rows) {
      console.log(`  • ${tr.trigger_name} (${tr.action_timing} ${tr.event_manipulation})`);
      console.log(`    ${tr.action_statement}`);
    }
  } else {
    console.log('  (aucun)');
  }

  // 7. RLS Policies
  try {
    const rls = await client.query(`
      SELECT policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = $1 AND tablename = $2
    `, [schema, table]);

    console.log(`\n🛡️  RLS Policies (${rls.rows.length})`);
    console.log('─'.repeat(70));
    if (rls.rows.length > 0) {
      for (const p of rls.rows) {
        console.log(`  • ${p.policyname} (${p.cmd}) → ${p.roles?.join(', ') || 'public'}`);
        if (p.qual) console.log(`    USING: ${p.qual}`);
        if (p.with_check) console.log(`    CHECK: ${p.with_check}`);
      }
    } else {
      console.log('  (aucune)');
    }
  } catch {
    // pg_policies might not exist in older PG versions
  }

  // 8. Échantillon (5 lignes)
  try {
    const sample = await client.query(`SELECT * FROM ${schema}.${table} LIMIT 5`);
    console.log(`\n📝 Échantillon (5 lignes)`);
    console.log('─'.repeat(70));
    if (sample.rows.length > 0) {
      console.log(JSON.stringify(sample.rows, null, 2));
    } else {
      console.log('  (table vide)');
    }
  } catch (e) {
    console.log(`\n📝 Échantillon: erreur (${e.message})`);
  }

  await client.end();
  console.log('\n✅ Inspection terminée.\n');
}

run().catch(e => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
