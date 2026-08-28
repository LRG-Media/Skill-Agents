#!/usr/bin/env node
/**
 * install-skills.mjs
 * Install & update agent skills from LRG-Media/Skill-Agents GitHub repo.
 *
 * Usage:
 *   node install-skills.mjs                    # interactive
 *   node install-skills.mjs --all              # install all categories
 *   node install-skills.mjs --categories backend,cloud
 *   node install-skills.mjs --dry-run          # preview without installing
 *   node install-skills.mjs --list             # list available skills
 *   node install-skills.mjs --update           # update with diff confirmation
 *   node install-skills.mjs --compare          # compare local vs remote
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';

// ─── Config ────────────────────────────────────────────────────────

const REPO_OWNER = 'LRG-Media';
const REPO_NAME = 'Skill-Agents';
const BRANCH = 'main';
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}`;

const CATEGORIES = {
  'cloud':              { label: 'Cloud (DNS, SSH, WordPress)', skills: [] },
  'global':             { label: 'Global (changelog, etc.)', skills: [] },
  'software/figma':     { label: 'Figma (design)', skills: [] },
  'software/github':    { label: 'GitHub (issues, PR)', skills: [] },
  'software/zoho':      { label: 'Zoho (accounting)', skills: [] },
  'web-portal':         { label: 'Web Portal (architect, permissions)', skills: [] },
  'web-portal/backend':  { label: 'Backend (Node.js/Express/Prisma)', skills: [] },
  'web-portal/frontend': { label: 'Frontend (React)', skills: [] },
};

// ─── Helpers ───────────────────────────────────────────────────────

function getWorkspaceSkillsDir() {
  const cwd = process.cwd();
  // Check if we're in a project with .github/skills
  const githubSkills = path.join(cwd, '.github', 'skills');
  if (fs.existsSync(path.join(cwd, '.github'))) {
    return githubSkills;
  }
  // Fallback: create .github/skills
  return githubSkills;
}

function getVscodeSettingsPath() {
  switch (process.platform) {
    case 'darwin': return path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'settings.json');
    case 'win32': return path.join(process.env.APPDATA || '', 'Code', 'User', 'settings.json');
    default: return path.join(os.homedir(), '.config', 'Code', 'User', 'settings.json');
  }
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'Accept': 'application/vnd.github.v3+json' },
  });
  if (res.ok === false) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchRaw(url) {
  const res = await fetch(url);
  if (res.ok === false) throw new Error(`Failed to fetch: ${res.status}`);
  return res.text();
}

async function fetchTree(p) {
  const url = `${API_BASE}/git/trees/${BRANCH}?recursive=1`;
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
    if (res.ok === false) {
      console.error(`API error: ${res.status} ${res.statusText}`);
      return [];
    }
    const data = await res.json();
    return data.tree.filter(f => f.type === 'blob' && f.path.startsWith(`skills/${p}`));
  } catch (e) {
    console.error(`Fetch error: ${e.message}`);
    return [];
  }
}

function askQuestion(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function sanitizeName(name) {
  // Remove category prefix like [architecture], [ops], etc.
  return name.replace(/^\[.*?\]\s*/, '');
}

// ─── Discover available skills ──────────────────────────────────────

async function discoverSkills() {
  const files = await fetchTree('');
  const skillFiles = files.filter(f => f.path.endsWith('/SKILL.md'));

  for (const file of skillFiles) {
    // Path: skills/category.../skill-name/SKILL.md
    const parts = file.path.split('/');
    // Everything between first 'skills/' and last two parts = category
    const skillDir = parts[parts.length - 2]; // skill folder name
    const categoryParts = parts.slice(1, parts.length - 2); // e.g. ['cloud'] or ['web-portal', 'backend']
    const category = categoryParts.join('/');
    const skillName = sanitizeName(skillDir);

    // Find matching category key (prefer exact match, then longest prefix)
    let matchedCat = null;
    // Sort keys by length descending to prefer more specific matches
    const sortedKeys = Object.keys(CATEGORIES).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (category === key) {
        matchedCat = key;
        break; // exact match
      }
      if (category.startsWith(key + '/') && matchedCat === null) {
        matchedCat = key; // longest prefix match (first found since sorted desc)
      }
    }

    if (matchedCat) {
      CATEGORIES[matchedCat].skills.push({ name: skillName, path: file.path });
    } else {
      // Add as new category
      if (!CATEGORIES[category]) {
        CATEGORIES[category] = { label: category, skills: [] };
      }
      CATEGORIES[category].skills.push({ name: skillName, path: file.path });
    }
  }

  return CATEGORIES;
}

// ─── Local/Remote comparison ──────────────────────────────────────

function getLocalSkills(skillsDir) {
  const local = new Map();
  if (fs.existsSync(skillsDir)) {
    const walk = (dir, relPrefix) => {
      for (const entry of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, entry);
        if (fs.statSync(fullPath).isDirectory()) {
          walk(fullPath, relPrefix ? `${relPrefix}/${entry}` : entry);
        } else if (entry === 'SKILL.md' && relPrefix) {
          const parts = relPrefix.split('/');
          // Sanitize both skill dir name AND category to match remote format
          const sanitizedParts = parts.map(sanitizeName);
          const skillName = sanitizedParts[sanitizedParts.length - 1];
          const category = sanitizedParts.slice(0, -1).join('/');
          const content = fs.readFileSync(fullPath, 'utf8');
          const key = `${category}/${skillName}`;
          local.set(key, { category, name: skillName, rawName: parts[parts.length - 1], content, path: fullPath });
        }
      }
    };
    walk(skillsDir, '');
  }
  return local;
}

function getContentHash(content) {
  // Simple hash for comparison - not cryptographic
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(16);
}

async function compareSkills(skillsDir) {
  const local = getLocalSkills(skillsDir);
  // Don't re-discover - use already populated CATEGORIES from main()

  const results = { new: [], updated: [], deleted: [], identical: [] };

  for (const [cat, data] of Object.entries(CATEGORIES)) {
    const seen = new Set();
    for (const skill of data.skills) {
      if (seen.has(skill.name)) continue;
      seen.add(skill.name);

      const remotePath = skill.path;
      const localKey = `${cat}/${skill.name}`;

      // Fetch remote content for comparison
      let remoteContent;
      try {
        remoteContent = await fetchRaw(`${RAW_BASE}/${remotePath}`);
      } catch (e) {
        continue;
      }

      const localEntry = local.get(localKey);

      if (!localEntry) {
        results.new.push({ category: cat, name: skill.name, remote: remotePath });
      } else {
        const localHash = getContentHash(localEntry.content);
        const remoteHash = getContentHash(remoteContent);
        if (localHash === remoteHash) {
          results.identical.push({ category: cat, name: skill.name });
        } else {
          results.updated.push({ category: cat, name: skill.name, local: localEntry.path, remote: remotePath });
        }
      }
    }
  }

  // Check for local-only skills (not in remote)
  const remoteSkillPaths = new Set();
  for (const [cat, data] of Object.entries(CATEGORIES)) {
    const seen = new Set();
    for (const skill of data.skills) {
      if (seen.has(skill.name)) continue;
      seen.add(skill.name);
      remoteSkillPaths.add(`${cat}/${skill.name}`);
    }
  }

  for (const [localKey, entry] of local) {
    if (remoteSkillPaths.has(localKey)) continue;
    results.deleted.push({ category: entry.category, name: entry.name, local: entry.path });
  }

  return results;
}

// ─── Install skills ────────────────────────────────────────────────

async function installCategory(category, categoryData, skillsDir, dryRun = false, force = false) {
  let installed = 0;

  for (const skill of categoryData.skills) {
    const targetDir = path.join(skillsDir, category, skill.name);
    const targetFile = path.join(targetDir, 'SKILL.md');

    // Check if already exists
    if (fs.existsSync(targetFile) && force === false) {
      // Compare with remote
      const remoteContent = await fetchRaw(`${RAW_BASE}/${skill.path}`);
      const localContent = fs.readFileSync(targetFile, 'utf8');
      if (getContentHash(remoteContent) === getContentHash(localContent)) {
        console.log(`  ⏭️  ${category}/${skill.name} (identical)`);
        continue;
      }
      console.log(`  🔄 ${category}/${skill.name} (different)`);
      const answer = await askQuestion(`     Override? [y/N]: `);
      if (answer.toLowerCase() !== 'y') {
        console.log(`     Skipped.`);
        continue;
      }
    }

    if (dryRun) {
      console.log(`  [DRY] ${category}/${skill.name}`);
      installed++;
      continue;
    }

    fs.mkdirSync(targetDir, { recursive: true });

    // Fetch SKILL.md
    const url = `${RAW_BASE}/${skill.path}`;
    const content = await fetchRaw(url);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log(`  ✅ ${category}/${skill.name}`);
    installed++;

    // Fetch additional files in the same directory
    const allFiles = await fetchTree(`skills/${category}/${skill.name}/`);
    for (const file of allFiles) {
      if (file.path.endsWith('/SKILL.md')) continue;
      const fileName = path.basename(file.path);
      const filePath = path.join(targetDir, fileName);
      try {
        const fileContent = await fetchRaw(`${RAW_BASE}/${file.path}`);
        fs.writeFileSync(filePath, fileContent, 'utf8');
      } catch (e) {
        console.log(`  ⚠️  Failed to fetch ${fileName}: ${e.message}`);
      }
    }
  }

  return installed;
}

// ─── Update VS Code settings ───────────────────────────────────────

function updateSettings(skillsDir, categories) {
  const settingsPath = getVscodeSettingsPath();
  if (!fs.existsSync(settingsPath)) {
    console.log(`\n⚠️  VS Code settings not found at: ${settingsPath}`);
    console.log('   Add the following to chat.agentSkillsLocations manually:');
    for (const cat of categories) {
      const relPath = path.relative(path.dirname(skillsDir), path.join(skillsDir, cat)).replace(/\\/g, '/');
      console.log(`   "${relPath}": true`);
    }
    return false;
  }

  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch {
    console.log(`\n⚠️  Could not parse settings.json`);
    return false;
  }

  if (!settings['chat.agentSkillsLocations']) {
    settings['chat.agentSkillsLocations'] = {};
  }

  const projectRoot = path.dirname(path.dirname(skillsDir)); // .github/skills → project root
  for (const cat of categories) {
    const key = `.github/skills/${cat}`.replace(/\\/g, '/');
    settings['chat.agentSkillsLocations'][key] = true;
  }

  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4) + '\n', 'utf8');
    console.log(`\n✅ VS Code settings updated: ${settingsPath}`);
    return true;
  } catch (e) {
    console.log(`\n⚠️  Failed to write settings: ${e.message}`);
    return false;
  }
}

// ─── CLI ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const listOnly = args.includes('--list');
  const compareOnly = args.includes('--compare');
  const installAll = args.includes('--all');
  const force = args.includes('--force');

  const categoriesArg = args.find(a => a.startsWith('--categories'));
  let selectedCategories = [];
  if (categoriesArg) {
    const idx = args.indexOf('--categories');
    selectedCategories = args[idx + 1]?.split(',').map(s => s.trim()) || [];
  }

  console.log(`\n📦 Skill Installer — ${REPO_OWNER}/${REPO_NAME}\n`);

  // Discover available skills
  await discoverSkills();

  if (compareOnly) {
    const skillsDir = getWorkspaceSkillsDir();
    console.log(`Comparing local vs remote in: ${skillsDir}\n`);
    const results = await compareSkills(skillsDir);

    if (results.identical.length > 0) {
      console.log(`✅ Identical (${results.identical.length}):`);
      results.identical.forEach(s => console.log(`  - ${s.category}/${s.name}`));
      console.log('');
    }
    if (results.updated.length > 0) {
      console.log(`🔄 Different (${results.updated.length}):`);
      results.updated.forEach(s => console.log(`  - ${s.category}/${s.name}`));
      console.log('');
    }
    if (results.new.length > 0) {
      console.log(`📥 New - not installed locally (${results.new.length}):`);
      results.new.forEach(s => console.log(`  - ${s.category}/${s.name}`));
      console.log('');
    }
    if (results.deleted.length > 0) {
      console.log(`⚠️  Local only - not in GitHub (${results.deleted.length}):`);
      results.deleted.forEach(s => console.log(`  - ${s.category}/${s.name}`));
      console.log('');
    }

    const total = results.identical.length + results.updated.length + results.new.length;
    console.log(`Summary: ${total} online, ${results.identical.length} identical, ${results.updated.length} to update, ${results.new.length} new, ${results.deleted.length} local-only`);
    return;
  }

  if (listOnly) {
    console.log('Available skills:\n');
    for (const [cat, data] of Object.entries(CATEGORIES)) {
      if (data.skills.length === 0) continue;
      console.log(`  ${data.label} (${cat})`);
      for (const s of data.skills) {
        console.log(`    - ${s.name}`);
      }
      console.log('');
    }
    return;
  }

  // Select categories
  if (selectedCategories.length === 0 && !installAll) {
    const entries = Object.entries(CATEGORIES).filter(([_, d]) => d.skills.length > 0);
    console.log('Available categories:\n');
    entries.forEach(([cat, data], i) => {
      console.log(`  ${(i + 1).toString().padStart(2)}. ${data.label} (${data.skills.length} skills)`);
    });
    console.log(`   a. All categories`);
    console.log(`   q. Quit\n`);

    const answer = await askQuestion('Select categories (comma-separated numbers): ');
    if (answer === 'q') { console.log('Aborted.'); return; }
    if (answer === 'a' || answer === 'all') {
      selectedCategories = entries.map(([cat]) => cat);
    } else {
      const indices = answer.split(',').map(s => parseInt(s.trim()) - 1);
      selectedCategories = indices.filter(i => i >= 0 && i < entries.length).map(i => entries[i][0]);
    }
  }

  if (installAll) {
    selectedCategories = Object.entries(CATEGORIES).filter(([_, d]) => d.skills.length > 0).map(([cat]) => cat);
  }

  if (selectedCategories.length === 0) {
    console.log('No categories selected.');
    return;
  }

  const skillsDir = getWorkspaceSkillsDir();
  console.log(`\nTarget: ${skillsDir}`);
  console.log(`Categories: ${selectedCategories.join(', ')}\n`);

  if (dryRun) {
    console.log('[DRY RUN] Would install:\n');
  }

  let totalInstalled = 0;
  for (const cat of selectedCategories) {
    const data = CATEGORIES[cat];
    if (!data || data.skills.length === 0) {
      console.log(`  ⚠️  ${cat}: no skills found`);
      continue;
    }
    console.log(`${data.label}:`);
    const count = await installCategory(cat, data, skillsDir, dryRun, force);
    totalInstalled += count;
  }

  if (dryRun) {
    console.log(`\n[DRY RUN] ${totalInstalled} skills would be installed.`);
    return;
  }

  console.log(`\n✅ Installed ${totalInstalled} skills`);

  // Update VS Code settings
  updateSettings(skillsDir, selectedCategories);

  console.log('\n🔄 Restart VS Code to load new skills.');
}

main().catch(console.error);
