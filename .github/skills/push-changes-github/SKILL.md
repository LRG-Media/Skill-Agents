---
name: push-changes-github
description: 'Pousser les changements de code sur GitHub avec messages de commit structurés et gestion de branche.'
argument-hint: 'Message de commit au format type: description (ex: feat: add search feature).'
user-invocable: true
---

# Push Changes GitHub

## Objectif

Automatiser le processus de push sur GitHub avec validation des changements, messages de commit professionnels et gestion de branche.

## Quand Utiliser

**Invoquer ce skill** quand on demande de :
- Pusher, pousser les changements
- Commiter et pusher
- Envoyer le code sur GitHub

## Règles

### Commit Types

| Type | Usage |
|------|-------|
| **feat:** | Nouvelles fonctionnalités |
| **fix:** | Corrections de bugs |
| **docs:** | Mises à jour de documentation |
| **refactor:** | Refactorisation de code |
| **perf:** | Améliorations de performance |
| **test:** | Ajout de tests |
| **chore:** | Maintenance, dépendances |
| **style:** | Formatage, linting |

### Commit Message Template

```
type(scope): brief description

- Optional detailed explanation
- List of changes if needed
```

### Rules
- Type + description concise en anglais
- Pas de point final
- Max 8-10 mots pour la description
- Un changement logique par commit (atomic)

## Workflow

1. **Check changes** — Afficher les fichiers modifiés (`git status`)
2. **Validate message** — Vérifier le format du commit
3. **Stage files** — Exécuter `git add -A`
4. **Create commit** — Créer le commit avec message structuré
5. **Push branch** — Pousser vers origin
6. **Confirm push** — Afficher URL GitHub et détails

## Sécurité

- ⚠️ Vérification de la branche actuelle avant push
- ⚠️ Affichage des fichiers avant commit
- ⚠️ Validation du format du message
- ⚠️ Confirmation avant push (si demandé)

## Exemples

```bash
# Push simple
git add -A && git commit -m "feat: add search functionality in sidebar" && git push

# Push avec scope
git add -A && git commit -m "fix(auth): resolve token refresh issue" && git push

# Push refactor
git add -A && git commit -m "refactor: extract inspection helpers into utils" && git push
```

### Exemple de prompt

```
"Push mes changements avec le message: feat: implement sidebar search"
"Commit et push: fix: repair inspection card button"
"Push: refactor: update generic feature grid view"
```

## Best Practices

- ✅ Messages clairs : Type + description concise
- ✅ Commits atomiques : Un changement logique par commit
- ✅ Vérification locale avant de pousser
- ✅ Conscience de la branche : Toujours vérifier la branche active
- ✅ Branches nommées : main, develop, feature/*
