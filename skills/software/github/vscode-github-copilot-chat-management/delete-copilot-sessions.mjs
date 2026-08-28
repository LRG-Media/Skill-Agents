#!/usr/bin/env node
/**
 * delete-copilot-sessions.mjs
 * Interactive script to delete VS Code Copilot Chat sessions.
 *
 * Usage:
 *   node scripts/delete-copilot-sessions.mjs                     # interactive picker
 *   node scripts/delete-copilot-sessions.mjs --list               # list all sessions
 *   node scripts/delete-copilot-sessions.mjs --id <sessionId>    # delete by ID
 *   node scripts/delete-copilot-sessions.mjs --empty              # delete all empty sessions
 *   node scripts/delete-copilot-sessions.mjs --all                # delete ALL sessions (dangerous!)
 *
 * ⚠️  VS Code MUST be closed before running to avoid SQLite conflicts.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { DatabaseSync } from 'node:sqlite';

// ─── Platform ───────────────────────────────────────────────────────

function getVscodeBase() {
  switch (process.platform) {
    case 'darwin': return path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User');
    case 'win32': return path.join(process.env.APPDATA || '', 'Code', 'User');
    default: return path.join(os.homedir(), '.config', 'Code', 'User');
  }
}

// ─── DB helpers ─────────────────────────────────────────────────────

function readDbKey(dbPath, key) {
  if (!fs.existsSync(dbPath)) return null;
  try {
    const db = new DatabaseSync(dbPath, { open: true, readOnly: true });
    const row = db.prepare('SELECT value FROM ItemTable WHERE key = ?').get(key);
    db.close();
    return row ? JSON.parse(row.value) : null;
  } catch { return null; }
}

function writeDbKey(dbPath, key, value) {
  try {
    const db = new DatabaseSync(dbPath, { open: true, readOnly: false });
    db.prepare('UPDATE ItemTable SET value = ? WHERE key = ?').run(JSON.stringify(value), key);
    db.close();
    return true;
  } catch { return false; }
}

// ─── Workspace name ─────────────────────────────────────────────────

function getWorkspaceName(wsDir) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(wsDir, 'workspace.json'), 'utf8'));
    const folder = data.folder || '';
    if (folder.startsWith('file:///')) {
      let cleaned = folder.slice(8);
      if (process.platform === 'win32' && /^\/[a-zA-Z]:/.test(cleaned)) cleaned = cleaned.slice(1);
      return path.basename(cleaned);
    }
    return path.basename(folder);
  } catch { return path.basename(wsDir).slice(0, 12); }
}

// ─── Discover all sessions ──────────────────────────────────────────

function discoverSessions(base) {
  const sessions = [];
  const wsBase = path.join(base, 'workspaceStorage');
  if (!fs.existsSync(wsBase)) return sessions;

  // Build archived map
  const archivedMap = new Map();
  for (const entry of fs.readdirSync(wsBase)) {
    const dbPath = path.join(wsBase, entry, 'state.vscdb');
    const cache = readDbKey(dbPath, 'agentSessions.state.cache');
    if (Array.isArray(cache)) {
      for (const e of cache) {
        if (!e.resource) continue;
        try {
          const sid = Buffer.from(e.resource.split('/').pop(), 'base64').toString('utf8');
          if (e.archived) archivedMap.set(sid, true);
        } catch {}
      }
    }
  }

  for (const entry of fs.readdirSync(wsBase)) {
    const wsDir = path.join(wsBase, entry);
    if (!fs.statSync(wsDir).isDirectory()) continue;

    const workspaceName = getWorkspaceName(wsDir);
    const chatDir = path.join(wsDir, 'chatSessions');
    if (!fs.existsSync(chatDir)) continue;

    const index = readDbKey(path.join(wsDir, 'state.vscdb'), 'chat.ChatSessionStore.index');
    const titleMap = {};
    if (index?.entries) {
      for (const [sid, meta] of Object.entries(index.entries)) {
        if (meta.title) titleMap[sid] = meta.title;
      }
    }

    for (const f of fs.readdirSync(chatDir)) {
      if (!f.endsWith('.jsonl')) continue;
      const sessionId = f.replace('.jsonl', '');
      const jsonlPath = path.join(chatDir, f);

      // Parse minimal info
      let title = titleMap[sessionId] || null;
      let turns = 0;
      let isEmpty = false;
      let lastMessageDate = 0;
      try {
        const content = fs.readFileSync(jsonlPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const entry = JSON.parse(trimmed);
          if (entry.kind === 0 && entry.v) {
            if (entry.v.customTitle) title = entry.v.customTitle;
            if (Array.isArray(entry.v.requests)) turns = entry.v.requests.length;
            isEmpty = entry.v.isEmpty ?? false;
            if (entry.v.creationDate) lastMessageDate = entry.v.creationDate;
          } else if (entry.kind === 2 && Array.isArray(entry.v)) {
            turns += entry.v.length;
          }
        }
      } catch {}

      if (!title && index?.entries?.[sessionId]) {
        isEmpty = index.entries[sessionId].isEmpty ?? false;
      }

      sessions.push({
        sessionId,
        title: title || 'Untitled',
        workspace: workspaceName,
        workspaceHash: entry,
        turns,
        isEmpty,
        lastMessageDate,
        archived: archivedMap.has(sessionId),
        jsonlPath,
        size: fs.statSync(jsonlPath).size,
      });
    }
  }

  return sessions;
}

// ─── Delete session ─────────────────────────────────────────────────

function deleteSession(session) {
  const wsBase = path.join(getVscodeBase(), 'workspaceStorage');
  const wsDir = path.join(wsBase, session.workspaceHash);

  // 1. Delete .jsonl
  if (fs.existsSync(session.jsonlPath)) {
    fs.unlinkSync(session.jsonlPath);
  }

  // 2. Remove from chat index
  const dbPath = path.join(wsDir, 'state.vscdb');
  const index = readDbKey(dbPath, 'chat.ChatSessionStore.index');
  if (index?.entries?.[session.sessionId]) {
    delete index.entries[session.sessionId];
    writeDbKey(dbPath, 'chat.ChatSessionStore.index', index);
  }

  // 3. Remove from agentSessions cache
  const cache = readDbKey(dbPath, 'agentSessions.state.cache');
  if (Array.isArray(cache)) {
    const b64 = Buffer.from(session.sessionId, 'utf8').toString('base64');
    const resourcePattern = `vscode-chat-session://local/${b64}`;
    const filtered = cache.filter(e => e.resource !== resourcePattern);
    if (filtered.length !== cache.length) {
      writeDbKey(dbPath, 'agentSessions.state.cache', filtered);
    }
  }
}

// ─── Interactive input ──────────────────────────────────────────────

function askQuestion(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ─── CLI ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const base = getVscodeBase();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node scripts/delete-copilot-sessions.mjs [options]

Options:
  (none)          Interactive mode - pick sessions to delete
  --list, -l      List all sessions without deleting
  --id <id>       Delete a specific session by ID (first 8 chars)
  --empty         Delete all empty sessions (0 turns)
  --all           Delete ALL sessions (DANGEROUS!)
  --dry-run       Show what would be deleted without deleting

⚠️  VS Code MUST be closed before deleting sessions.
`);
    return;
  }

  const dryRun = args.includes('--dry-run');
  console.log(`Scanning: ${base}`);
  const sessions = discoverSessions(base);
  console.log(`Found ${sessions.length} sessions\n`);

  if (args.includes('--list') || args.includes('-l')) {
    const sorted = sessions.sort((a, b) => (b.archived - a.archived) || b.turns - a.turns);
    for (const s of sorted) {
      const arch = s.archived ? ' 📦' : '';
      const empty = s.isEmpty ? ' (empty)' : '';
      console.log(`  ${s.sessionId.slice(0, 8)}  ${s.title.slice(0, 50).padEnd(50)}  ${String(s.turns).padStart(3)} turns  ${s.workspace}${arch}${empty}`);
    }
    console.log(`\nTotal: ${sessions.length} sessions`);
    return;
  }

  let toDelete = [];

  // --all
  if (args.includes('--all')) {
    toDelete = sessions;
  }

  // --empty
  if (args.includes('--empty')) {
    toDelete = sessions.filter(s => s.isEmpty || s.turns === 0);
  }

  // --id
  const idIdx = args.indexOf('--id');
  if (idIdx !== -1 && args[idIdx + 1]) {
    const searchId = args[idIdx + 1].toLowerCase();
    toDelete = sessions.filter(s => s.sessionId.toLowerCase().startsWith(searchId));
    if (toDelete.length === 0) {
      console.log(`No session found matching "${searchId}"`);
      return;
    }
  }

  // Interactive mode — pick workspace first, then show archived
  if (toDelete.length === 0 && !args.includes('--all') && !args.includes('--empty') && idIdx === -1) {
    // Get unique workspaces with session counts
    const wsMap = new Map();
    for (const s of sessions) {
      const archCount = (wsMap.get(s.workspace)?.archived || 0) + (s.archived ? 1 : 0);
      const totalCount = (wsMap.get(s.workspace)?.total || 0) + 1;
      wsMap.set(s.workspace, { archived: archCount, total: totalCount });
    }

    const workspaces = [...wsMap.entries()].sort((a, b) => b[1].archived - a[1].archived);
    console.log('Workspaces:\n');
    workspaces.forEach(([name, counts], i) => {
      console.log(`  ${(i + 1).toString().padStart(3)}. ${name.padEnd(35)}  ${counts.archived} archived / ${counts.total} total`);
    });

    const wsAnswer = await askQuestion('\nSelect workspace number: ');
    const wsIdx = parseInt(wsAnswer) - 1;
    if (isNaN(wsIdx) || wsIdx < 0 || wsIdx >= workspaces.length) {
      console.log('Invalid selection.');
      return;
    }

    const selectedWs = workspaces[wsIdx][0];
    const archivedOnly = sessions.filter(s => s.archived && s.workspace === selectedWs);
    console.log(`\n📦 Archived sessions in "${selectedWs}" (${archivedOnly.length}):\n`);
    const sorted = archivedOnly.sort((a, b) => (b.lastMessageDate || 0) - (a.lastMessageDate || 0));
    sorted.forEach((s, i) => {
      const date = s.lastMessageDate ? new Date(s.lastMessageDate).toISOString().slice(0, 10) : '????-??-??';
      console.log(`  ${(i + 1).toString().padStart(3)}. ${date}  ${s.sessionId.slice(0, 8)}  ${s.title.slice(0, 50).padEnd(50)}  ${String(s.turns).padStart(3)} turns`);
    });

    console.log('\nEnter session numbers to delete (comma-separated), or:');
    console.log('  "all" = delete all archived in this workspace');
    console.log('  "q" = quit\n');

    const answer = await askQuestion('> ');

    if (answer === 'q' || answer === 'quit') {
      console.log('Aborted.');
      return;
    }

    if (answer === 'all') {
      toDelete = archivedOnly;
    } else {
      const indices = answer.split(',').map(s => parseInt(s.trim()) - 1).filter(i => i >= 0 && i < sorted.length);
      toDelete = indices.map(i => sorted[i]);
    }
  }

  if (toDelete.length === 0) {
    console.log('No sessions to delete.');
    return;
  }

  // Confirm
  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Will delete ${toDelete.length} session(s):\n`);
  for (const s of toDelete) {
    const arch = s.archived ? ' 📦' : '';
    console.log(`  - ${s.title} (${s.turns} turns, ${s.workspace})${arch}`);
  }

  if (!dryRun) {
    const confirm = await askQuestion(`\nDelete ${toDelete.length} session(s)? Type "yes" to confirm: `);
    if (confirm !== 'yes') {
      console.log('Aborted.');
      return;
    }

    let deleted = 0;
    for (const s of toDelete) {
      try {
        deleteSession(s);
        deleted++;
        console.log(`  ✅ Deleted: ${s.title}`);
      } catch (e) {
        console.log(`  ❌ Failed: ${s.title} — ${e.message}`);
      }
    }
    console.log(`\nDone! Deleted ${deleted}/${toDelete.length} sessions.`);
    console.log('Restart VS Code to apply changes.');
  } else {
    console.log('\n[DRY RUN] No changes made.');
  }
}

main().catch(console.error);
