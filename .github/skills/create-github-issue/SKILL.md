---
name: create-github-issue
description: 'Créer des issues GitHub structurées avec templates, checklists et catégorisation automatique.'
argument-hint: "Titre de l'issue au format [Scope] description en anglais."
user-invocable: true
---

# Create GitHub Issue

**Invoquer** quand on demande de créer une issue, un ticket, un bug report.

## Title Format

`[Scope] lowercase description in English` — max 8-10 mots, anglais, pas de point, pas de `feat:`/`fix:`.

| Scope | Usage |
|-------|-------|
| `[Frontend]` | React, CSS, UI |
| `[Backend]` | Node.js, Express, services |
| `[Mobile]` | React Native |
| `[Infra]` | DevOps, PM2, Nginx, SSH |
| `[API]` | Endpoints |
| `[DB]` | Prisma, migrations |

## Issue Types

| Type | Description |
|------|-------------|
| **Bug** | Problème imprévu |
| **Improvements** | Demande ou idée |

## Pinned Fields

| Champ | Bug | Improvements | Obligatoire |
|-------|:---:|:---:|:---:|
| **Priority** | ✅ | ✅ | Oui |
| **Target date** | — | ✅ | Non |
| **Feature** | ✅ | ✅ | Optionnel |

**Priority** : Urgent, High, Medium, Low

**Feature** — **⚠️ RÈGLE STRICTE** : Ne JAMAIS assigner si le scope n'est pas **explicitement** lié à un module existant (Admin, CRM, CoMuse, Communication, Finance, Project, Settings, Site Health, Integrations, Feedbacks). En doute → ne pas passer `--feature`.

> Les IDs sont résolus dynamiquement via GraphQL (`repository.issueTypes`). Pas de valeurs hardcodées.

## Workflow

1. Auto-detect repo owner/name depuis git remote
2. Resolve issue types + pinned fields via GraphQL
3. Gather context — poser des questions
4. Déterminer type + titre
5. Appeler `create-issue.sh`
6. Afficher le lien créé

## Script : create-issue.sh

**Utiliser `--body-file`** pour éviter les erreurs de parsing (guillemets, backticks, newlines).

### Arguments

| Arg | Obligatoire | Défaut | Valeurs |
|-----|:-----------:|--------|---------|
| `--title` | ✅ | — | `[Scope] description` |
| `--type` | ✅ | — | `Bug` \| `Improvements` |
| `--body` | ✅* | — | Corps court |
| `--body-file` | ✅* | — | Fichier markdown (**recommandé**) |
| `--priority` | ✅ | — | `Urgent` \| `High` \| `Medium` \| `Low` |
| `--feature` | ❌ | — | Module existant |
| `--project` | ❌ | `Roadmap` | Nom du projet |

### Exemples

```bash
# Avec --body-file (recommandé pour bodies longs)
cat > /tmp/issue-body.md << 'EOF'
## Description
Modal closes but data not sent.

## Steps
1. Navigate to `/contacts/new`
2. Fill form, click Save
EOF

./create-issue.sh --title "[Frontend] save button does not send data" \
  --type "Bug" --body-file /tmp/issue-body.md --priority "Medium"

# Avec --body (pour bodies courts)
./create-issue.sh --title "[Frontend] fix typo in button" \
  --type "Bug" --body "Says 'Cancel' instead of 'Annuler'" --priority "Low"
```
