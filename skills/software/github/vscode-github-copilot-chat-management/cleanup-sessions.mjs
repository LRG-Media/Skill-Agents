import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

const wsDir = 'C:/Users/louka/AppData/Roaming/Code/User/workspaceStorage/250ab752c3d39d0e54d6abb72701aa68';
const dbPath = path.join(wsDir, 'state.vscdb');
const chatDir = path.join(wsDir, 'chatSessions');

console.log('⚠️  VS Code must be CLOSED before running this script.\n');

// ─── 1. Clean chat index: remove empty sessions ───────────────────

const db = new DatabaseSync(dbPath, { open: true, readOnly: false });
const row = db.prepare("SELECT value FROM ItemTable WHERE key='chat.ChatSessionStore.index'").get();
const index = JSON.parse(row.value);

const emptyIds = Object.entries(index.entries)
  .filter(([k, v]) => v.isEmpty)
  .map(([k]) => k);

console.log(`1. Removing ${emptyIds.length} empty sessions from chat index...`);
for (const id of emptyIds) {
  delete index.entries[id];
}
db.prepare("UPDATE ItemTable SET value = ? WHERE key = 'chat.ChatSessionStore.index'")
  .run(JSON.stringify(index));
console.log(`   ✅ Index updated: ${Object.keys(index.entries).length} sessions remaining\n`);

// ─── 2. Delete .jsonl files for empty sessions ────────────────────

let deletedFiles = 0;
for (const id of emptyIds) {
  const jsonlPath = path.join(chatDir, id + '.jsonl');
  if (fs.existsSync(jsonlPath)) {
    try {
      fs.unlinkSync(jsonlPath);
      deletedFiles++;
    } catch (e) {
      console.log(`   ⚠️  Failed to delete ${id}.jsonl: ${e.message}`);
    }
  }
}
console.log(`2. Deleted ${deletedFiles} .jsonl files for empty sessions\n`);

// ─── 3. Clean agentSessions.state.cache: remove orphaned entries ──

const cacheRow = db.prepare("SELECT value FROM ItemTable WHERE key='agentSessions.state.cache'").get();
if (cacheRow) {
  const cache = JSON.parse(cacheRow.value);
  const validIds = new Set(Object.keys(index.entries));
  
  const before = cache.length;
  const cleaned = cache.filter(e => {
    try {
      const sid = Buffer.from(e.resource.split('/').pop(), 'base64').toString('utf8');
      return validIds.has(sid);
    } catch { return false; }
  });
  
  console.log(`3. Cleaning agentSessions.state.cache...`);
  console.log(`   Before: ${before} entries`);
  console.log(`   Removed: ${before - cleaned.length} orphaned entries`);
  console.log(`   After: ${cleaned.length} entries`);
  
  db.prepare("UPDATE ItemTable SET value = ? WHERE key = 'agentSessions.state.cache'")
    .run(JSON.stringify(cleaned));
  console.log(`   ✅ Cache updated\n`);
}

db.close();

// ─── 4. Delete orphaned .jsonl files ──────────────────────────────

const remainingIds = new Set(Object.keys(index.entries));
const allJsonl = fs.readdirSync(chatDir).filter(f => f.endsWith('.jsonl'));
const orphanJsonl = allJsonl.filter(f => !remainingIds.has(f.replace('.jsonl', '')));

let deletedOrphans = 0;
for (const f of orphanJsonl) {
  try {
    fs.unlinkSync(path.join(chatDir, f));
    deletedOrphans++;
  } catch {}
}
console.log(`4. Deleted ${deletedOrphans} orphaned .jsonl files (not in index)\n`);

// ─── Summary ──────────────────────────────────────────────────────

const finalJsonl = fs.readdirSync(chatDir).filter(f => f.endsWith('.jsonl')).length;
console.log('=== Summary ===');
console.log(`Sessions in index: ${Object.keys(index.entries).length}`);
console.log(`.jsonl files remaining: ${finalJsonl}`);
console.log(`Done! Restart VS Code to apply changes.`);
