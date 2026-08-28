---
name: skill-repertory
description: "Gérer le répertoire de skills Copilot: lister, télécharger, mettre à jour et comparer les skills entre le repo GitHub LRG-Media/Skill-Agents et le workspace local. Vérifie les différences avant d'override. Ne supprime jamais du GitHub quand on supprime en local."
---

# Skill Repertory

Gestion centralisée des skills Copilot via le repo `LRG-Media/Skill-Agents`.

## Commandes

```bash
# Lister les skills disponibles en ligne
node .github/skills/software/github/install-skills.mjs --list

# Installer (mode interactif)
node .github/skills/software/github/install-skills.mjs

# Installer toutes les catégories
node .github/skills/software/github/install-skills.mjs --all

# Installer une catégorie spécifique
node .github/skills/software/github/install-skills.mjs --categories cloud,global

# Mettre à jour les skills existants (compare avant d'override)
node .github/skills/software/github/install-skills.mjs --update

# Dry run (voir sans agir)
node .github/skills/software/github/install-skills.mjs --dry-run
```

## Workflow de mise à jour

1. Lister les skills du repo GitHub
2. Comparer chaque SKILL.md local vs distant (hash ou contenu)
3. **Si différent** → Demander confirmation avant d'override
4. **Si identique** → Skip
5. **Si nouveau** → Installer
6. **Si supprimé en local** → Ne PAS supprimer du GitHub, proposer de réinstaller

## Règles critiques

- **Ne jamais supprimer du GitHub** quand un skill est supprimé en local
- **Toujours comparer** avant d'override (prompt de confirmation)
- **Mettre à jour les settings VS Code** automatiquement après install
- Le script est dynamique : détecte automatiquement les nouvelles catégories du repo

## Fichiers

| Fichier | Rôle |
|---------|------|
| `install-skills.mjs` | Script d'installation/mise à jour |
| `SKILL.md` | Cette documentation |
