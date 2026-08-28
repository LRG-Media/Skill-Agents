---
name: vscode-github-copilot-chat-management
description: "Gérer les sessions Copilot Chat VS Code: exporter, supprimer, nettoyer les sessions archivées, vides et orphelines. Lecture/écriture SQLite (state.vscdb), parsing JSONL, détection archived via agentSessions.state.cache."
---

# VS Code GitHub Copilot Chat Management

Outils Node.js pour gérer les sessions Copilot Chat VS Code depuis le terminal.

**Invocation :** Ce skill n'est pas chargé automatiquement. L'agent doit le charger explicitement en lisant ce fichier SKILL.md quand l'utilisateur demande de gérer les sessions Copilot Chat (export, suppression, nettoyage).

## ⚠️ Règle critique

**VS Code doit être FERMÉ** avant toute opération d'écriture (delete, cleanup) pour éviter les conflits SQLite. L'export (read-only) peut se faire pendant que VS Code tourne.

## Architecture des données VS Code

```
%APPDATA%/Code/User/
├── workspaceStorage/<hash>/
│   ├── workspace.json              # mapping hash → folder path
│   ├── state.vscdb                 # SQLite: index + cache
│   │   └── ItemTable
│   │       ├── chat.ChatSessionStore.index   # JSON: {entries: {sessionId: {title, isEmpty, ...}}}
│   │       └── agentSessions.state.cache     # JSON: [{resource, archived?, read?}]
│   └── chatSessions/
│       └── <sessionId>.jsonl       # session data (kind 0=metadata, 1=patch, 2=array patch)
└── globalStorage/
    └── emptyWindowChatSessions/    # sessions sans workspace
```

### Détection "archived"

L'état archived est dans `agentSessions.state.cache` (PAS dans le chat index) :

```javascript
// resource URI = vscode-chat-session://local/{base64(sessionId)}
const sessionId = Buffer.from(entry.resource.split('/').pop(), 'base64').toString('utf8');
const isArchived = entry.archived === true;
```

### Format JSONL (kind values)

| kind | Contenu |
|------|---------|
| 0 | Metadata complète: `v.requests[]`, `v.sessionId`, `v.creationDate`, `v.customTitle` |
| 1 | Patch propriété (ex: `["customTitle"]` → string) |
| 2 | Patch tableau `["requests"]` → nouveaux messages |

## Scripts

### 1. extract-copilot-chats.mjs — Export

Export read-only de toutes les sessions en JSON reimportable ou Markdown.

```bash
# Exporter les archivées du workspace actuel
node .github/skills/vscode-github-copilot-chat-management/extract-copilot-chats.mjs --archived --current-workspace -f json

# Exporter TOUTES les sessions (active/ + archived/)
node .github/skills/vscode-github-copilot-chat-management/extract-copilot-chats.mjs --current-workspace -f json

# Lister les sessions
node .github/skills/vscode-github-copilot-chat-management/extract-copilot-chats.mjs --current-workspace --list
```

**Options :**

| Flag | Description |
|------|-------------|
| `-o, --output-dir` | Dossier de sortie (défaut: `<skill>/copilot_chats`) |
| `-f, --format` | `markdown`, `json`, ou `both` (défaut: `both`) |
| `-l, --list` | Lister sans exporter |
| `-n, --limit` | Limiter le nombre d'exports |
| `--archived` | Uniquement les archivées |
| `-w, --current-workspace` | Uniquement le workspace actuel (par cwd) |
| `--vscode-dir` | Override le path VS Code |

**Structure de sortie :**
```
copilot_chats/
  └── <WorkspaceName>/
      ├── active/       (sessions non archivées)
      └── archived/     (sessions archivées 📦)
```

**Format JSON exporté :**
```json
{
  "responderUsername": "GitHub Copilot",
  "initialLocation": "panel",
  "sessionId": "uuid",
  "customTitle": "Titre du chat",
  "requests": [{ "message": {...}, "response": [...] }],
  "archived": true
}
```

### 2. delete-copilot-sessions.mjs — Suppression interactive

Script interactif pour supprimer des sessions.

```bash
# Mode interactif: pick workspace → pick archived sessions
node .github/skills/vscode-github-copilot-chat-management/delete-copilot-sessions.mjs

# Lister toutes les sessions
node .github/skills/vscode-github-copilot-chat-management/delete-copilot-sessions.mjs --list

# Supprimer par ID (8 premiers caractères)
node .github/skills/vscode-github-copilot-chat-management/delete-copilot-sessions.mjs --id d150de6f

# Supprimer toutes les vides
node .github/skills/vscode-github-copilot-chat-management/delete-copilot-sessions.mjs --empty

# Dry run
node .github/skills/vscode-github-copilot-chat-management/delete-copilot-sessions.mjs --dry-run
```

**Flux interactif :**
1. Affiche la liste des workspaces avec compteur archived/total
2. L'utilisateur choisit un workspace
3. Affiche les sessions archivées du workspace (du plus récent au plus ancien)
4. L'utilisateur entre les numéros à supprimer (virgule-separated) ou "all" / "q"

**Ce qui est supprimé :**
1. Fichier `.jsonl` → supprimé
2. `chat.ChatSessionStore.index` → entrée retirée
3. `agentSessions.state.cache` → entrée retirée

### 3. cleanup-sessions.mjs — Nettoyage automatique

Supprime les sessions vides (0 turns) et les entrées orphelines.

```bash
# ⚠️ VS Code doit être fermé
node .github/skills/vscode-github-copilot-chat-management/cleanup-sessions.mjs
```

**Effectue :**
1. Retire les sessions `isEmpty=true` de l'index
2. Supprime les `.jsonl` correspondants
3. Nettoie `agentSessions.state.cache` des entrées orphelines
4. Supprime les `.jsonl` orphelins (pas dans l'index)

## Dépendances

Aucune dépendance npm externe. Utilise uniquement :
- `node:sqlite` (DatabaseSync) — built-in Node.js 22+
- `fs`, `path`, `os`, `readline` — stdlib

## Notes techniques

### SQLite Access

```javascript
import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync(dbPath, { open: true, readOnly: true });
const row = db.prepare('SELECT value FROM ItemTable WHERE key = ?').get(key);
db.close();
```

### Recherche du workspace courant

Le hash du workspace est résolu en comparant `workspace.json` → `folder` (URI) avec `process.cwd()` :

```javascript
const cwd = process.cwd().replace(/\\/g, '/').toLowerCase();
const folder = decodeURIComponent(data.folder).replace(/^file:\/{2,3}/, '');
if (cwd.includes(folder) || folder.includes(cwd)) { /* match */ }
```

### Cross-platform

| Platform | VS Code base path |
|----------|-------------------|
| Windows | `%APPDATA%/Code/User` |
| macOS | `~/Library/Application Support/Code/User` |
| Linux | `~/.config/Code/User` |
