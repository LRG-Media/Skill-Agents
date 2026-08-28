---
name: changelog-updater
description: 'Mettre à jour automatiquement le fichier CHANGELOG.md après chaque session de travail impliquant des modifications de code (ajout, suppression, refactorisation, fix). À invoquer systématiquement en fin de session ou après un lot de changements significatifs.'
argument-hint: 'Résume les changements effectués dans la session en cours (types + descriptions).'
user-invocable: true
---

# Changelog Updater

## Objectif

Mettre à jour `CHANGELOG.md` dans le dossier du skill (`.github/skills/changelog-updater/CHANGELOG.md`) après chaque session de travail contenant des modifications de code.

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

1. **Format** : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) sans Semantic Versioning
2. **Un seul fichier** : `CHANGELOG.md` dans le dossier du skill (`c:\Projects\PortalWebApp\.github\skills\changelog-updater\CHANGELOG.md`)
3. **Sections par date** : Regrouper tous les changements d'une même journée sous une seule entrée `## YYYY-MM-DD`. Si une entrée pour la date du jour existe déjà, ajouter les changements en dessous.
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
- **Seul fichier à lire** : `CHANGELOG.md` dans le dossier du skill (obligatoire, pour connaître la version actuelle et insérer la nouvelle section)
- Si le dernier `replace_string_in_file` ou `multi_replace_string_in_file` concerne déjà `CHANGELOG.md`, ne pas le relire non plus — réutiliser le contenu connu

## Structure de la section à ajouter

```markdown
## YYYY-MM-DD

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
2. **Lire `CHANGELOG.md`** (une seule fois) — pour connaître la dernière date et la structure existante
3. **Vérifier si une entrée pour la date du jour existe déjà** :
   - Si oui → **Fusionner** les changements dans les sections `### Added`, `### Changed`, `### Fixed` etc. **déjà existantes** pour cette date. **Ne JAMAIS créer de doublons de sections** (ex: deux `### Added` sous la même date).
   - Si non → créer une nouvelle entrée `## YYYY-MM-DD` au-dessus de la plus récente
4. **Construire les sections** à partir du contexte de conversation (pas de relecture)
5. **Insérer** les nouveaux items sous les sections existantes correspondantes (ou créer une nouvelle section si elle n'existe pas encore pour cette date)

## Exemple de résultat attendu

```markdown
## 2026-07-13

### Added
- **Nouvelle route `/reports`** pour les rapports d'inspections

### Changed
- **Refactor `InspectionService`** — extraction des helpers :
  - `InspectionService.js` : logique métier séparée
  - `InspectionController.js` : appels service simplifiés

### Fixed
- **Double redirect** sur `/login` après refresh — `AuthContext.jsx`
```
