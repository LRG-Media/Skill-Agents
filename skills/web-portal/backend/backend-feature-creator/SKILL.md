---
name: backend-feature-creator
description: 'Créer une nouvelle feature backend complète dans server/features/. Couvre : Prisma schema, Controller, Service, Routes, Validation, Models, index.js, README, Test, enregistrement API routes, et permissions. Utiliser pour tout ajout de feature backend.'
argument-hint: 'Domaine (crm, finance, communication, project-management, system, custom), nom de la feature, et description courte.'
user-invocable: true
---

# Backend Feature Creator

## Objectif

Créer une nouvelle feature backend complète et cohérente dans `server/features/[domain]/[feature]/`, en respectant toutes les conventions du projet : structure lean, nomenclature, patterns Controller/Service/Routes, validation, permissions, et enregistrement API.

## Quand Utiliser

- Ajout d'une nouvelle feature backend (CRUD complet)
- Création d'une nouvelle entité métier (ex: `crm/warranties/`, `finance/credit-notes/`)
- Ajout d'un module dans un domaine existant
- Création d'une feature custom pour un portail spécifique (`custom/[portal]/[feature]/`)

## Prérequis

1. **Prisma schema** : le modèle doit exister dans `server/prisma/schema/` (ou être créé en étape 1)
2. **Domaine cible** : identifier le domaine (`crm`, `finance`, `communication`, `project-management`, `system`, `custom`)
3. **Permissions** : prévoir les 3 niveaux : `view`, `edit`, `manage`
4. **Portails** : si feature portal-spécifique, utiliser `custom/[portal]/[feature]/` + `portal-feature-dependencies.js`

## Conventions Obligatoires

| Élément | Convention | Exemples |
|---------|-----------|----------|
| Dossier feature | **kebab-case** | `credit-notes/`, `time-tracking/` |
| Dossier domaine | **singulier** | `crm/`, `finance/`, `custom/` |
| Dossier custom | **nom du portail** | `custom/comuse/`, `custom/lrgmedia/` |
| Contrôleur | `PascalCaseController.js` | `CreditNoteController.js` |
| Service | `feature.service.js` | `credit-note.service.js` |
| Routes | `feature.routes.js` | `credit-note.routes.js` |
| Validation | `feature.validation.js` | `credit-note.validation.js` |
| Model classe | `PascalCase.js` | `CreditNote.js` |
| Schema Prisma | `PascalCaseSchema.js` | `CreditNotesSchema.js` |
| Index | `index.js` | barrel exports |
| Test | `test.feature.routes.mjs` | `test.credit-note.routes.mjs` |
| API fields | **snake_case** | `created_at`, `account_id`, `is_active` |
| Classes | **PascalCase** | `CreditNoteController`, `CreditNoteService` |

## Règle Lean (Structure)

```
0-1 fichier d'un type → rester à la racine de la feature
2+ fichiers d'un type → créer le sous-dossier avec index.js
Exception : models/ est TOUJOURS un dossier, même avec 1 fichier
Ne JAMAIS créer de dossier permissions/ → utiliser le middleware central
```

## Workflow Complet (12 Étapes)

| Étape | Fichier | Description |
|-------|---------|-------------|
| 1 | Prisma Schema | `server/prisma/schema/[model].prisma` + migration |
| 2 | Directory Structure | Règle lean (0-1 = racine, 2+ = sous-dossier) |
| 3 | Validation | `[feature].validation.js` — JSON Schema |
| 4 | Model | `models/[Feature].js` — classe business |
| 5 | Schema Documentation | `models/[Feature]Schema.js` |
| 6 | Service | `[feature].service.js` — Prisma + soft delete + custom fields |
| 7 | Controller | `[Feature]Controller.js` — 5 helpers privés obligatoires |
| 8 | Routes | `[feature].routes.js` — `createRoutePresets` + validation |
| 9 | Index.js | Barrel exports |
| 10 | README.md | Documentation complète |
| 11 | Test | `test.[feature].routes.mjs` — structure auto-test |
| 12 | Enregistrement | `apiRouteConfig.js` + permissions + portal config |

## Fichiers Référence

Détails complets pour chaque étape, templates de code, et exemples :

```
references/
├── 00-quick-reference.md         — Patterns rapides (imports, helpers, routes, responses)
├── 01-prisma-schema.md           — Modèle Prisma, migrations, multi-schema
├── 02-directory-structure.md     — Règle lean, templates, conventions de nommage
├── 03-validation.md              — JSON Schema, validateRequest, patterns
├── 04-model.md                   — Business model class, getters, toSummary/toDetailedObject
├── 05-schema-documentation.md    — Prisma Schema class, BASE_SCHEMA, ENUMS
├── 06-service.md                 — Prisma queries, soft delete, custom fields, performance
├── 07-controller.md              — 5 helpers privés, méthodes CRUD, response methods
├── 08-routes.md                  — createRoutePresets, permissions, validation middleware
├── 09-index-exports.md           — Barrel exports, variantes par taille
├── 10-readme.md                  — Template README, contenu obligatoire
├── 11-test-file.md               — test.*.routes.mjs, imports, structure
├── 12-api-registration.md        — apiRouteConfig, permissions, portal config
├── advanced-patterns.md          — Custom fields, cache, activity log, aggregations, transactions
├── anti-patterns.md              — Erreurs courantes et solutions
└── checklist.md                  — Checklist de validation complète
```

## Quick Reference

Voir `references/00-quick-reference.md` pour les patterns rapides (imports, 5 helpers, routes, responses, soft delete, API registration).

## Skills Complémentaires

| Skill | Usage | Relation avec ce skill
|-------|-------|------------------------|
| `backend-feature-structure` | Audit structurel, refactorisation, nettoyage legacy | **Post-création** — auditer la feature après implémentation |
| `backend-custom-fields-integration` | Intégrer ModuleFieldsService dans un service | **Étape 6** — quand la feature nécessite des custom fields |
| `server-feature-optimization` | Audit performance/sécurité d'une feature existante | **Post-création** — optimiser après implémentation |
| `portal-feature-architect` | Architecture multi-portail, feature flags, permissions | **Pré-création** — concevoir l'architecture avant d'implémenter |
| `prisma-cli` | Commandes CLI Prisma (migrate, generate, studio) | **Étape 1** — exécuter les migrations |
| `prisma-client-api` | Référence API Prisma Client (queries, filtres, transactions) | **Étape 6** — patterns avancés de queries |
