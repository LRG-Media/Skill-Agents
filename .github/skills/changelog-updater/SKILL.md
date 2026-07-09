---
name: changelog-updater
description: 'Mettre à jour automatiquement le fichier CHANGELOG.md après chaque session de travail impliquant des modifications de code (ajout, suppression, refactorisation, fix). À invoquer systématiquement en fin de session ou après un lot de changements significatifs.'
argument-hint: 'Résume les changements effectués dans la session en cours (types + descriptions).'
user-invocable: true
---

# Changelog Updater

## Objectif

Mettre à jour `CHANGELOG.md` à la racine du projet après chaque session de travail contenant des modifications de code.

## Quand Utiliser

**Invoquer ce skill en fin de session** quand au moins un des cas suivants est vrai :
- Des fichiers ont été créés, modifiés ou supprimés
- Des routes ont été ajoutées, renommées ou retirées
- Des features ont été implémentées ou refactorisées
- Des bugs ont été corrigés
- La documentation a été mise à jour en lien avec du code
- Des dépendances ont été ajoutées ou retirées

**Ne pas invoquer** si la session n'a produit aucun changement de code (pure Q&A, analyse, lecture seule).

## Règles

1. **Format** : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) + [Semantic Versioning](https://semver.org/lang/fr/)
2. **Un seul fichier** : `CHANGELOG.md` à la racine du projet (`c:\Projects\ClientPortalLRG\CHANGELOG.md`)
3. **Versions** : Si les changements sont importants (nouvelle feature, breaking change) → bump de version. Si petits fixes → ajouter à la version en cours.
4. **Sections** : Utiliser uniquement `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`
5. **Date** : Utiliser la date du jour au format `YYYY-MM-DD`
6. **Langue** : Français
7. **Détail** : Lister chaque fichier modifié en sous-point avec le chemin relatif
8. **Ne jamais écraser** : Ajouter les changements au-dessus de la section existante la plus récente, ne jamais réécrire l'historique

## ⚠️ Règle anti-gaspillage de tokens

**NE PAS relire les fichiers modifiés durant la session.**

Le skill fonctionne **uniquement à partir du contexte de conversation déjà disponible** :
- Les fichiers déjà lus/modifiés dans la session sont déjà en mémoire
- Si un fichier n'a pas été lu dans la session, ne pas le lire — le décrire de manière générique
- **Seul fichier à lire** : `CHANGELOG.md` (obligatoire, pour connaître la version actuelle et insérer la nouvelle section)
- Si le dernier `replace_string_in_file` ou `multi_replace_string_in_file` concerne déjà `CHANGELOG.md`, ne pas le relire non plus — réutiliser le contenu connu

## Structure de la section à ajouter

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- **Description** du ajout — contexte

### Changed
- **Description** du changement — fichiers impactés :
  - `chemin/fichier1.jsx` : détail
  - `chemin/fichier2.js` : détail

### Removed
- **Description** de la suppression

### Fixed
- **Description** du fix
```

## Workflow

1. **Vérifier le contexte** — Identifier les changements déjà documentés dans la conversation (fichiers modifiés, routes ajoutées/supprimées, etc.). Ne relire aucun fichier sauf CHANGELOG.md.
2. **Lire `CHANGELOG.md`** (une seule fois) — pour connaître la version en cours et la structure existante
3. **Déterminer le bump de version** :
   - **Major** (X.0.0) : breaking changes
   - **Minor** (x.Y.0) : nouvelles features
   - **Patch** (x.y.Z) : corrections de bugs, petits ajustements
4. **Construire la section** à partir du contexte de conversation (pas de relecture)
5. **Insérer** la nouvelle section au-dessus de la section précédente (sous le `---` séparateur)
6. **Mettre à jour** le lien de comparaison si présent

## Exemple de résultat attendu

```markdown
## [1.2.0] - 2026-07-02

### Added
- **Nouvelle route `/reports`** pour les rapports d'inspections

### Changed
- **Refactor `InspectionService`** — extraction des helpers :
  - `InspectionService.js` : logique métier séparée
  - `InspectionController.js` : appels service simplifiés

### Fixed
- **Double redirect** sur `/login` après refresh — `AuthContext.jsx`
```
