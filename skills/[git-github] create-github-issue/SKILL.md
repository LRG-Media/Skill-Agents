---
name: git-github--create-github-issue
description: 'Créer des issues GitHub structurées avec templates, checklists et catégorisation automatique.'
argument-hint: "Titre de l'issue au format [Scope] description en anglais."
user-invocable: true
---

# Create GitHub Issue

**Invoquer** quand on demande de créer une issue, un ticket, un bug report.

## ⚠️ RÈGLES CRITIQUES — LIS CECI EN PREMIER

- **Ne PAS lire** le script `create-issue.sh` — il est auto-expliquant, appelle-le directement
- **Script path** : `.github/skills/create-github-issue/create-issue.sh` (relatif au workspace)

## Workflow (6 étapes max)

1. **Extraire** de la demande : type (Bug/Improvements), titre, description, priority, feature (si mentionnée)
2. **Valider** que tu as : titre `[Scope] desc`, type, priority, body avec `## Description`
3. **Créer** le fichier body via `create_file` → `tmp/issue-body.md` (racine workspace)
4. **Appeler** le script (voir commande ci-dessous)
5. **Supprimer** `tmp/issue-body.md` via `run_in_terminal` (`rm -f tmp/issue-body.md`)
6. **Afficher** le lien GitHub créé

## Titre

`[Scope] lowercase description in English` — max 8-10 mots, pas de `feat:`/`fix:`.

Scopes : `[Frontend]` `[Backend]` `[Mobile]` `[Infra]` `[API]` `[DB]`

## Types & Champs

- **Bug** → Priority obligatoire
- **Improvements** → Priority obligatoire, Target date optionnelle
- **Feature** : uniquement si scope = module existant (Admin, CRM, CoMuse, Communication, Finance, Project, Settings, Site Health, Integrations, Feedbacks). Sinon → ne pas passer `--feature`

## Commande

```bash
# Depuis la racine du workspace :
.github/skills/create-github-issue/create-issue.sh \
  --title "[Scope] description" \
  --type "Bug" \
  --body-file tmp/issue-body.md \
  --priority "Medium" \
  [--feature "CRM"]
```

## Fichier body

Créer via `create_file` (JAMAIS via terminal `cat`). Exemple :

```markdown
## Description
La modale de contact ne ferme pas après sauvegarde.

## Steps to reproduce
1. Ouvrir la modale
2. Remplir le formulaire
3. Cliquer sur Enregistrer

## Expected behavior
La modale se ferme et les données sont envoyées.

## Actual behavior
La modale reste ouverte, aucune requête réseau.
```
