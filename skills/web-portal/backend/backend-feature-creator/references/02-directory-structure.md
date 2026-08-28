# Étape 2 : Directory Structure

Créer la structure selon la règle lean.

## Règle Lean (Obligatoire)

```
0-1 fichier d'un type → rester à la racine de la feature
2+ fichiers d'un type → créer le sous-dossier avec index.js
Exception : models/ est TOUJOURS un dossier, même avec 1 fichier
Ne JAMAIS créer de dossier permissions/ → utiliser le middleware central
```

## Template Standard

```
server/features/[domain]/[feature]/
├── index.js                          # Barrel exports (OBLIGATOIRE)
├── README.md                         # Documentation feature (OBLIGATOIRE)
├── test.[feature].routes.mjs         # Tests endpoints (OBLIGATOIRE)
├── [Feature]Controller.js            # ou controllers/ si 2+ fichiers
├── [feature].service.js              # ou services/ si 2+ fichiers
├── [feature].routes.js               # ou routes/ si 2+ fichiers
├── [feature].validation.js           # JSON Schema validation
├── [feature].utils.js                # SEULEMENT si nécessaire (2+ fonctions réutilisables)
└── models/                           # TOUJOURS un dossier
    ├── [Feature].js                  # Business model class
    └── [Feature]Schema.js            # Prisma schema documentation
```

## Exemple Concret

```
server/features/finance/credit-notes/
├── index.js
├── README.md
├── test.credit-note.routes.mjs
├── CreditNoteController.js
├── credit-note.service.js
├── credit-note.routes.js
├── credit-note.validation.js
└── models/
    ├── CreditNote.js
    └── CreditNotesSchema.js
```

## Exemple avec Sous-Dossiers (2+ fichiers)

```
server/features/crm/contacts/
├── index.js
├── README.md
├── test.contact.routes.mjs
├── ContactController.js
├── contact.routes.js
├── contact.validation.js
├── models/
│   ├── Contact.js
│   └── ContactsSchema.js
├── services/                          # 2+ services → sous-dossier
│   ├── index.js
│   ├── contact.service.js
│   ├── contact.search.js
│   └── contact.related.js
└── utils/
    ├── index.js
    └── contactHelpers.js
```

## Feature Custom (Portail-Spécifique)

```
server/features/custom/[portal]/[feature]/
├── index.js
├── README.md
├── test.[feature].routes.mjs
├── [Feature]Controller.js
├── [feature].service.js
├── [feature].routes.js
├── [feature].validation.js
└── models/
    ├── [Feature].js
    └── [Feature]Schema.js
```

**Différence** : chemin `custom/[portal]/[feature]/` au lieu de `[domain]/[feature]/`.
Imports relatifs plus longs (ex: `../../../../shared/...`).

## Conventions de Nommage

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
| API fields | **snake_case** | `created_at`, `user_id`, `is_active` |
| Classes | **PascalCase** | `CreditNoteController`, `CreditNoteService` |

## Règle de Taille de Fichier

- Cible : **< 500 lignes** par fichier
- À partir de 500 lignes : planifier un split par responsabilité
  - Ex: `service.js` → `service.js` + `service.search.js`
  - Ex: `Controller.js` → `Controller.js` + `Controller Bulk.js`
