#!/usr/bin/env node
/**
 * extract-copilot-chats.mjs
 * Extract all VS Code GitHub Copilot Chat conversations.
 * Port Node.js du script Python original.
 *
 * Usage:
 *   node scripts/extract-copilot-chats.mjs [--output-dir ./copilot_chats] [--format markdown|json|both] [--list]
 *
 * Storage locations:
 *   Windows: %APPDATA%/Code/User/workspaceStorage/<hash>/chatSessions/*.jsonl
 *   macOS:   ~/Library/Application Support/Code/User/workspaceStorage/<hash>/chatSessions/*.jsonl
 *   Linux:   ~/.config/Code/User/workspaceStorage/<hash>/chatSessions/*.jsonl
 *
 * Filename format:
 *   {DATE}__{WORKSPACE}__{TITLE}__{SESSION_ID}.{ext}
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { DatabaseSync } from 'node:sqlite';

// ─── Platform detection ─────────────────────────────────────────────

function getVscodeBase() {
  switch (process.platform) {
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User');
    case 'win32':
      return path.join(process.env.APPDATA || '', 'Code', 'User');
    default:
      return path.join(os.homedir(), '.config', 'Code', 'User');
  }
}

// ─── SQLite reader (reads state.vscdb) ─────────────────────────────

function readDbKey(dbPath, key) {
  if (!fs.existsSync(dbPath)) return null;
  try {
    const db = new DatabaseSync(dbPath, { open: true, readOnly: true });
    const row = db.prepare('SELECT value FROM ItemTable WHERE key = ?').get(key);
    db.close();
    return row ? JSON.parse(row.value) : null;
  } catch {
    return null;
  }
}

// ─── Archived sessions detection ────────────────────────────────────

/**
 * Reads agentSessions.state.cache from state.vscdb and returns a Map
 * of sessionId → { archived: boolean, read: number }.
 * The resource URI format is: vscode-chat-session://local/{base64(sessionId)}
 */
function readArchivedMap(dbPath) {
  const map = new Map();
  if (!fs.existsSync(dbPath)) return map;
  try {
    const db = new DatabaseSync(dbPath, { open: true, readOnly: true });
    const row = db.prepare("SELECT value FROM ItemTable WHERE key = 'agentSessions.state.cache'").get();
    db.close();
    if (!row) return map;
    const entries = JSON.parse(row.value);
    for (const entry of entries) {
      if (!entry.resource) continue;
      try {
        const b64 = entry.resource.split('/').pop();
        const sessionId = Buffer.from(b64, 'base64').toString('utf8');
        map.set(sessionId, {
          archived: entry.archived === true,
          read: entry.read || null,
        });
      } catch { /* skip invalid entries */ }
    }
  } catch { /* skip if DB unreadable */ }
  return map;
}

// ─── Workspace name from workspace.json ─────────────────────────────

function getWorkspaceName(wsDir) {
  const wsJson = path.join(wsDir, 'workspace.json');
  try {
    const data = JSON.parse(fs.readFileSync(wsJson, 'utf8'));
    const folder = data.folder || '';
    if (folder.startsWith('file:///')) {
      // file:///c:/path or file:///Users/...
      let cleaned = folder.slice(8); // remove file:///
      // On Windows the path is like /c:/Users/... → strip leading /
      if (process.platform === 'win32' && /^\/[a-zA-Z]:/.test(cleaned)) {
        cleaned = cleaned.slice(1);
      }
      return path.basename(cleaned);
    }
    return path.basename(folder);
  } catch {
    return path.basename(wsDir).slice(0, 12);
  }
}

// ─── Parse .jsonl session file ──────────────────────────────────────

function parseSessionJsonl(filePath) {
  if (!fs.existsSync(filePath)) return null;

  const session = {
    sessionId: path.basename(filePath, '.jsonl'),
    title: null,
    creationDate: null,
    requests: [],
    rawData: null, // The raw Copilot-format object from kind=0
  };

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const entry = JSON.parse(trimmed);
      const kind = entry.kind;

      if (kind === 0) {
        // Session metadata — v contains the full Copilot-format session object
        const v = entry.v || {};
        session.creationDate = v.creationDate;
        session.sessionId = v.sessionId || session.sessionId;
        if (v.customTitle) session.title = v.customTitle;
        // Store the raw v object for reimportable JSON export
        session.rawData = v;
        // kind=0 v.requests contains the COMPLETE requests array
        if (Array.isArray(v.requests)) {
          session.requests = v.requests;
        }
      } else if (kind === 1) {
        // Property patch
        const k = entry.k;
        const v = entry.v;
        if (Array.isArray(k) && k.length === 1 && k[0] === 'customTitle' && typeof v === 'string') {
          session.title = v;
          if (session.rawData) session.rawData.customTitle = v;
        }
      } else if (kind === 2) {
        // Array patch (incremental requests)
        const k = entry.k;
        const v = entry.v;
        if (Array.isArray(k) && k.length === 1 && k[0] === 'requests' && Array.isArray(v)) {
          session.requests.push(...v);
          if (session.rawData && Array.isArray(session.rawData.requests)) {
            session.rawData.requests.push(...v);
          }
        }
      }
    }
  } catch (e) {
    console.error(`  ⚠️  Failed to parse ${filePath}: ${e.message}`);
    return null;
  }

  return session;
}

// ─── Response extraction helpers ────────────────────────────────────

function extractResponseText(responseParts) {
  if (!Array.isArray(responseParts)) return '';
  const texts = [];
  for (const part of responseParts) {
    if (part && typeof part === 'object') {
      if (typeof part.value === 'string' && part.value.trim()) {
        texts.push(part.value);
      } else if (Array.isArray(part.content)) {
        for (const c of part.content) {
          if (c && typeof c.value === 'string') texts.push(c.value);
        }
      }
    } else if (typeof part === 'string') {
      texts.push(part);
    }
  }
  return texts.join('\n');
}

function extractToolCalls(responseParts) {
  if (!Array.isArray(responseParts)) return [];
  return responseParts
    .filter(p => p && typeof p === 'object' && p.kind === 'toolCall')
    .map(p => p.toolName || p.name || 'unknown');
}

// ─── Formatting ─────────────────────────────────────────────────────

function formatTimestamp(ts) {
  if (!ts) return 'unknown date';
  try {
    return new Date(ts).toISOString().replace('T', ' ').slice(0, 19);
  } catch {
    return String(ts);
  }
}

function sanitizeFilename(name, maxLen = 80) {
  return (name || 'untitled')
    .replace(/[^\w\s\-.]/g, '')
    .replace(/\s+/g, '_')
    .trim()
    .slice(0, maxLen) || 'untitled';
}

// ─── Output formatters ──────────────────────────────────────────────

function sessionToMarkdown(session, workspaceName = '') {
  const lines = [];
  const title = session.title || 'Untitled Chat';
  const created = formatTimestamp(session.creationDate);

  lines.push(`# ${title}`, '');
  if (workspaceName) lines.push(`**Workspace:** ${workspaceName}`);
  lines.push(`**Created:** ${created}`);
  lines.push(`**Session ID:** ${session.sessionId || 'unknown'}`, '', '---', '');

  const requests = session.requests || [];
  if (!requests.length) {
    lines.push('*(Empty conversation)*');
    return lines.join('\n');
  }

  for (let i = 0; i < requests.length; i++) {
    const req = requests[i];
    const message = req.message || {};
    const userText = typeof message === 'object' ? (message.text || '') : String(message);
    const timestamp = formatTimestamp(req.timestamp);
    const modelId = req.modelId || '';
    const response = req.response || [];
    const responseText = extractResponseText(response);
    const toolCalls = extractToolCalls(response);

    lines.push(`## Turn ${i + 1}`, '');
    if (modelId) lines.push(`*Model: ${modelId} | ${timestamp}*`, '');
    lines.push('### User', '', userText || '*(empty message)*', '');
    lines.push('### Assistant', '');
    if (toolCalls.length) lines.push(`*Tool calls: ${toolCalls.join(', ')}*`, '');
    lines.push(responseText || '*(no response text)*', '', '---', '');
  }

  return lines.join('\n');
}

/**
 * Export in the exact Copilot reimportable format.
 * The raw v object from kind=0 already matches the chat.json schema:
 *   { responderUsername, initialLocation, requests: [...], customTitle, sessionId, ... }
 */
function sessionToJson(session, workspaceName = '') {
  if (session.rawData) {
    return session.rawData;
  }
  // Fallback: reconstruct the format from parsed data
  return {
    responderUsername: 'GitHub Copilot',
    initialLocation: 'panel',
    sessionId: session.sessionId,
    customTitle: session.title || '',
    creationDate: session.creationDate,
    requests: session.requests || [],
  };
}

// ─── Session discovery ──────────────────────────────────────────────

function discoverAllSessions(base, archivedMap) {
  const sessions = [];

  // 1. Global empty-window sessions
  const globalDir = path.join(base, 'globalStorage', 'emptyWindowChatSessions');
  if (fs.existsSync(globalDir)) {
    for (const f of fs.readdirSync(globalDir)) {
      if (f.endsWith('.jsonl')) {
        const s = parseSessionJsonl(path.join(globalDir, f));
        if (s) {
          const info = archivedMap.get(s.sessionId);
          sessions.push({ workspace: '(no workspace)', archived: info?.archived ?? false, ...s });
        }
      }
    }
  }

  // 2. Per-workspace sessions
  const wsBase = path.join(base, 'workspaceStorage');
  if (fs.existsSync(wsBase)) {
    for (const entry of fs.readdirSync(wsBase)) {
      const wsDir = path.join(wsBase, entry);
      if (!fs.statSync(wsDir).isDirectory()) continue;

      const workspaceName = getWorkspaceName(wsDir);
      const chatDir = path.join(wsDir, 'chatSessions');
      if (!fs.existsSync(chatDir)) continue;

      // Get session titles from state.vscdb index
      const titleMap = {};
      const index = readDbKey(path.join(wsDir, 'state.vscdb'), 'chat.ChatSessionStore.index');
      if (index && index.entries) {
        for (const [sid, meta] of Object.entries(index.entries)) {
          if (meta.title) titleMap[sid] = meta.title;
        }
      }

      for (const f of fs.readdirSync(chatDir)) {
        if (!f.endsWith('.jsonl')) continue;
        const s = parseSessionJsonl(path.join(chatDir, f));
        if (!s) continue;
        // Fill in title from index if not found in JSONL
        if (!s.title && titleMap[s.sessionId]) {
          s.title = titleMap[s.sessionId];
        }
        const info = archivedMap.get(s.sessionId);
        sessions.push({ workspace: workspaceName, archived: info?.archived ?? false, ...s });
      }
    }
  }

  return sessions;
}

// ─── CLI ────────────────────────────────────────────────────────────

function parseArgs() {
  const raw = process.argv.slice(2);
  const opts = { outputDir: path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), 'copilot_chats'), format: 'both', list: false, vscodeDir: null, limit: 0, archivedOnly: false, currentWorkspace: false };
  for (let i = 0; i < raw.length; i++) {
    if ((raw[i] === '--output-dir' || raw[i] === '-o') && raw[i + 1]) opts.outputDir = raw[++i];
    else if ((raw[i] === '--format' || raw[i] === '-f') && raw[i + 1]) opts.format = raw[++i];
    else if ((raw[i] === '--limit' || raw[i] === '-n') && raw[i + 1]) opts.limit = parseInt(raw[++i], 10);
    else if (raw[i] === '--list' || raw[i] === '-l') opts.list = true;
    else if (raw[i] === '--archived') opts.archivedOnly = true;
    else if (raw[i] === '--current-workspace' || raw[i] === '-w') opts.currentWorkspace = true;
    else if (raw[i] === '--vscode-dir' && raw[i + 1]) opts.vscodeDir = raw[++i];
  }
  return opts;
}

function main() {
  const opts = parseArgs();
  const base = opts.vscodeDir || getVscodeBase();

  if (!fs.existsSync(base)) {
    console.error(`Error: VS Code data directory not found: ${base}`);
    process.exit(1);
  }

  // Build archived map from all workspaces
  console.log(`Scanning: ${base}`);
  const archivedMap = new Map();
  const wsBase = path.join(base, 'workspaceStorage');
  if (fs.existsSync(wsBase)) {
    for (const entry of fs.readdirSync(wsBase)) {
      const dbPath = path.join(wsBase, entry, 'state.vscdb');
      const map = readArchivedMap(dbPath);
      for (const [k, v] of map) archivedMap.set(k, v);
    }
  }
  const archivedCount = [...archivedMap.values()].filter(v => v.archived).length;
  console.log(`Archived sessions in cache: ${archivedCount}`);

  // Resolve current workspace hash if --current-workspace
  let currentWsHash = null;
  if (opts.currentWorkspace) {
    const cwd = process.cwd().replace(/\\/g, '/').toLowerCase();
    if (fs.existsSync(wsBase)) {
      for (const entry of fs.readdirSync(wsBase)) {
        const wsDir = path.join(wsBase, entry);
        const wsJson = path.join(wsDir, 'workspace.json');
        if (!fs.existsSync(wsJson)) continue;
        try {
          const data = JSON.parse(fs.readFileSync(wsJson, 'utf8'));
          let folder = (data.folder || '').replace(/\\/g, '/').toLowerCase();
          folder = decodeURIComponent(folder).replace(/^file:\/{2,3}/, '');
          if (folder.startsWith('/')) folder = folder.slice(1);
          if (cwd.includes(folder) || folder.includes(cwd)) {
            currentWsHash = entry;
            break;
          }
        } catch { /* skip */ }
      }
    }
    if (currentWsHash) {
      console.log(`Current workspace: ${currentWsHash}`);
    } else {
      console.log('Warning: Could not match current workspace, scanning all');
    }
  }

  const sessions = discoverAllSessions(base, archivedMap);

  // Sort by creation date (newest first)
  sessions.sort((a, b) => (b.creationDate || 0) - (a.creationDate || 0));

  // Apply filters
  let filtered = sessions;
  if (opts.archivedOnly) {
    filtered = filtered.filter(s => s.archived);
  }
  if (currentWsHash) {
    // Only sessions from the current workspace's chatSessions dir
    filtered = filtered.filter(s => {
      const wsDir = path.join(wsBase, currentWsHash);
      const chatDir = path.join(wsDir, 'chatSessions', s.sessionId + '.jsonl');
      return fs.existsSync(chatDir);
    });
  }

  console.log(`Found ${filtered.length} sessions` + (opts.archivedOnly ? ' (archived only)' : '') + (currentWsHash ? ' (current workspace)' : '') + '\n');

  if (opts.list) {
    for (const s of filtered) {
      const title = s.title || 'Untitled';
      const created = formatTimestamp(s.creationDate);
      const arch = s.archived ? ' 📦 ARCHIVED' : '';
      console.log(`  [${s.workspace}] ${title} (${s.requests.length} turns, ${created})${arch}`);
    }
    return;
  }

  fs.mkdirSync(opts.outputDir, { recursive: true });

  let exported = 0;
  for (const s of filtered) {
    if (opts.limit && exported >= opts.limit) break;
    if (!s.requests || s.requests.length === 0) continue;

    const title = s.title || 'Untitled';
    const sid = s.sessionId || 'unknown';
    const safeTitle = sanitizeFilename(title);
    const safeWs = sanitizeFilename(s.workspace);
    const dateStr = s.creationDate
      ? new Date(s.creationDate).toISOString().slice(0, 10)
      : 'unknown-date';

    // Create workspace subdirectory with archived/active split
    const statusDir = s.archived ? 'archived' : 'active';
    const wsDir = path.join(opts.outputDir, safeWs, statusDir);
    fs.mkdirSync(wsDir, { recursive: true });
    const baseName = `${dateStr}__${safeWs}__${safeTitle}__${sid.slice(0, 8)}`;

    if (opts.format === 'markdown' || opts.format === 'both') {
      fs.writeFileSync(
        path.join(wsDir, `${baseName}.md`),
        sessionToMarkdown(s, s.workspace)
      );
    }

    if (opts.format === 'json' || opts.format === 'both') {
      // Add archived flag to the exported JSON
      const jsonData = sessionToJson(s, s.workspace);
      jsonData.archived = s.archived;
      fs.writeFileSync(
        path.join(wsDir, `${baseName}.json`),
        JSON.stringify(jsonData, null, 2)
      );
    }

    exported++;
    console.log(`  Exported: ${title} (${s.requests.length} turns) [${s.workspace}]` + (s.archived ? ' 📦' : ''));
  }

  const totalTurns = filtered.reduce((n, s) => n + (s.requests?.length || 0), 0);
  const workspaces = new Set(filtered.map(s => s.workspace));

  console.log(`\nDone! Files written to: ${path.resolve(opts.outputDir)}`);
  console.log(`  Total sessions: ${filtered.length}`);
  console.log(`  Exported: ${exported}`);
  console.log(`  Total turns: ${totalTurns}`);
  console.log(`  Workspaces: ${workspaces.size}`);
}

main();
