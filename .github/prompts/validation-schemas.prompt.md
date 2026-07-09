---
name: validation-schemas
description: Refactorise les routes et crée FeatureValidation.js avec enums + schemas JSON Schema
keywords: ["routes", "validation", "schemas", "refactoring", "backend", "architecture"]
---

# 🛤️ Refactorisation Routes & Validation Standard

## 📁 Structure de Localisation

La structure feature doit respecter ce layout **EXACT**:

```
server/features/FEATURE/
│
├── FeatureController.js                    ✅ À LA RACINE
├── FeatureService.js                       ✅ À LA RACINE
├── FeatureValidation.js                    ✅ À LA RACINE (NOUVEAU)
│
├── routes/
│   └── featureRoutes.js                    ✅ Clean (< 100 lignes)
│
├── permissions/
│   └── featurePermissions.js
│
├── utils/
│   ├── helpers.js                          (Date, string utils)
│   └── formatters.js                       (Data transformation)
│
└── index.js                                (Exports)
```

**🚨 RÈGLES ABSOLUES:**
- ✅ `FeatureValidation.js` à la **RACINE** (pas dans utils/)
- ✅ Schemas **sortis de routes.js** et mis dans Validation
- ✅ Routes file réduit à **< 100 lignes** (configuration UNIQUEMENT)
- ✅ Pas de logique métier dans routes.js
- ✅ Schemas JSON Schema UNIQUEMENT dans Validation

---

## 🚨 VALIDATION PRÉALABLE OBLIGATOIRE

**AVANT de commencer la refactorisation**, tu DOIS :

1. **Analyser la feature** (sans modifier)
   - Lire routes.js 
   - Identifier les schemas inline
   - Identifier les énums
   - Vérifier l'état actuel

2. **Présenter l'analyse à l'utilisateur**
   ```
   🔍 ANALYSE FEATURE: [NomFeature]
   
   Fichier: [chemin]
   État actuel:
   - Routes.js: [X lignes]
   - Enums: [où sont-ils]
   - Schemas: [où sont-ils, combien]
   - Problèmes identifiés: [liste]
   
   Plan de refactorisation:
   - Créer FeatureValidation.js
   - Extraire [X] énums
   - Extraire [X] schemas
   - Réduire routes.js de [X] → [Y] lignes
   
   Prêt à procéder ? (OUI/NON)
   ```

3. **Attendre la validation de l'utilisateur** ✅
   - Si OUI → Procéder à la refactorisation
   - Si NON → ARRÊTER et demander ce qu'il faut changer

4. **SEULEMENT APRÈS → Refactoriser**

---

## Instruction

Si l'utilisateur a VALIDÉ l'analyse:

Refactorise cette feature pour créer FeatureValidation.js et épurer routes.js conformément au **FORMAT STANDARD**.

---

## Format Standard Obligatoire

### 1️⃣ FeatureValidation.js (NOUVEAU FICHIER)

**UNIQUEMENT** ces 2 exports:

```javascript
/**
 * 🔍 Feature Validation Schemas & Enums
 * @description JSON Schema definitions et énums pour validation des requêtes
 * @version 1.0.0
 */

// 🎯 ENUMS/CONSTANTS - Réutilisables partout
export const FEATURE_ENUMS = {
  status: ['active', 'inactive', 'pending', 'completed', 'cancelled'],
  priority: ['low', 'normal', 'high', 'urgent'],
  sortFields: ['name', 'status', 'priority', 'created_at', 'updated_at', 'amount_cents'],
  order: ['asc', 'desc'],
  currency: ['CAD', 'USD', 'EUR']
};

// 📋 JSON SCHEMA VALIDATION SCHEMAS - Pour validateRequest()
export const FEATURE_VALIDATION_SCHEMAS = {
  
  // ═══ CREATE Operation
  create: {
    body: {
      type: 'object',
      required: ['name', 'account_id'],
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 255 },
        description: { type: 'string', maxLength: 10000 },
        status: { type: 'string', enum: FEATURE_ENUMS.status },
        priority: { type: 'string', enum: FEATURE_ENUMS.priority },
        category: { type: 'string', maxLength: 100 },
        tags: { type: 'array', items: { type: 'string', maxLength: 50 }, maxItems: 20 },
        amount_cents: { type: 'integer', minimum: 0 },
        currency: { type: 'string', enum: FEATURE_ENUMS.currency },
        account_id: { type: 'integer', minimum: 1 },
        assigned_to: { type: 'integer', minimum: 1 },
        metadata: { type: 'object' }
      },
      additionalProperties: false
    }
  },

  // ═══ UPDATE Operation
  update: {
    body: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 255 },
        description: { type: ['string', 'null'], maxLength: 10000 },
        status: { type: 'string', enum: FEATURE_ENUMS.status },
        priority: { type: 'string', enum: FEATURE_ENUMS.priority },
        category: { type: ['string', 'null'], maxLength: 100 },
        tags: { type: 'array', items: { type: 'string', maxLength: 50 }, maxItems: 20 },
        amount_cents: { type: ['integer', 'null'], minimum: 0 },
        currency: { type: 'string', enum: FEATURE_ENUMS.currency },
        assigned_to: { type: ['integer', 'null'], minimum: 1 },
        metadata: { type: ['object', 'null'] }
      },
      additionalProperties: false
    }
  },

  // ═══ LIST/QUERY Operation
  query: {
    query: {
      type: 'object',
      properties: {
        page: { type: 'string', pattern: '^[0-9]+$' },
        limit: { type: 'string', pattern: '^[0-9]+$' },
        search: { type: 'string', maxLength: 255 },
        status: { type: 'string', enum: FEATURE_ENUMS.status },
        priority: { type: 'string', enum: FEATURE_ENUMS.priority },
        category: { type: 'string', maxLength: 100 },
        tags: { type: 'string', maxLength: 500 },
        created_by: { type: 'string', pattern: '^[0-9]+$' },
        assigned_to: { type: 'string', pattern: '^[0-9]+$' },
        date_from: { type: 'string', format: 'date' },
        date_to: { type: 'string', format: 'date' },
        amount_min: { type: 'string', pattern: '^[0-9]+$' },
        amount_max: { type: 'string', pattern: '^[0-9]+$' },
        sort_by: { type: 'string', enum: FEATURE_ENUMS.sortFields },
        sort_order: { type: 'string', enum: FEATURE_ENUMS.order }
      },
      additionalProperties: false
    }
  },

  // ═══ Autres Operations (selon besoin)
  statusUpdate: {
    body: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: FEATURE_ENUMS.status }
      },
      additionalProperties: false
    }
  },

  advancedSearch: {
    body: {
      type: 'object',
      properties: {
        filters: {
          type: 'object',
          properties: {
            text: { type: 'string', maxLength: 255 },
            tags: { type: 'array', items: { type: 'string' } },
            status: { type: 'array', items: { type: 'string', enum: FEATURE_ENUMS.status } }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 }
          }
        }
      }
    }
  }
};
```

---

### 2️⃣ FeatureRoutes.js (RÉFACTORISÉ)

**UNIQUEMENT** ces 4 éléments:

```javascript
/**
 * 🛣️ Feature Routes - Optimisé & Épuré
 * @description Routes pour la gestion des features avec réponses standardisées
 * @version 2.0.0 (Format Standard)
 */

import { Router } from 'express';
import { FeatureController } from '../FeatureController.js';
import { FEATURE_VALIDATION_SCHEMAS } from '../FeatureValidation.js';  // ✅ IMPORT depuis Validation
import { featureMiddlewares, injectFeaturePermissions } from '../permissions/featurePermissions.js';
import { validateRequest, paginationMiddleware } from '../../../shared/middleware/index.js';
import { generalLimiter } from '../../../shared/middleware/rateLimiter.js';

const router = Router();

// 🔧 MIDDLEWARE COMPOSITION - Centralisé
const mw = {
  base: [generalLimiter],
  read: [generalLimiter, ...featureMiddlewares.read(), injectFeaturePermissions()],
  write: [generalLimiter, ...featureMiddlewares.create(), injectFeaturePermissions()],
  update: [generalLimiter, ...featureMiddlewares.update(), injectFeaturePermissions()],
  delete: [generalLimiter, ...featureMiddlewares.delete(), injectFeaturePermissions()]
};

// ═══════════════════════════════════════════════════════════════════════════
// 📋 SPECIAL ROUTES (AVANT les routes génériques /:id)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /feature/dashboard - Dashboard stats
 */
router.get('/dashboard',
  ...mw.read,
  FeatureController.getDashboard
);

/**
 * GET /feature/search - Advanced search
 */
router.get('/search',
  ...mw.read,
  validateRequest(FEATURE_VALIDATION_SCHEMAS.advancedSearch),  // ✅ Reference depuis Validation
  paginationMiddleware({ defaultLimit: 20, maxLimit: 100 }),
  FeatureController.search
);

// ═══════════════════════════════════════════════════════════════════════════
// 📋 GENERAL/CRUD ROUTES (APRÈS les special routes)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /feature - List all with pagination
 */
router.get('/',
  ...mw.read,
  validateRequest(FEATURE_VALIDATION_SCHEMAS.query),  // ✅ Reference depuis Validation
  paginationMiddleware({ defaultLimit: 20, maxLimit: 100 }),
  FeatureController.getAll
);

/**
 * GET /feature/:id - Get by ID
 */
router.get('/:id',
  ...mw.read,
  FeatureController.getById
);

/**
 * POST /feature - Create new
 */
router.post('/',
  ...mw.write,
  validateRequest(FEATURE_VALIDATION_SCHEMAS.create),  // ✅ Reference depuis Validation
  FeatureController.create
);

/**
 * PUT /feature/:id - Update existing
 */
router.put('/:id',
  ...mw.update,
  validateRequest(FEATURE_VALIDATION_SCHEMAS.update),  // ✅ Reference depuis Validation
  FeatureController.update
);

/**
 * DELETE /feature/:id - Delete
 */
router.delete('/:id',
  ...mw.delete,
  FeatureController.delete
);

export default router;
```

---

## ✅ Checklist de Conformité

### FeatureValidation.js

- [ ] **Fichier location:** À la racine `/features/feature/FeatureValidation.js`
- [ ] **Export 1:** `export const FEATURE_ENUMS = { ... }`
  - [ ] `status` array défini
  - [ ] `priority` array défini
  - [ ] `sortFields` array défini
  - [ ] `order: ['asc', 'desc']`
  - [ ] Autres énums spécifiques
- [ ] **Export 2:** `export const FEATURE_VALIDATION_SCHEMAS = { ... }`
  - [ ] `create` schema (body)
  - [ ] `update` schema (body)
  - [ ] `query` schema (query parameters)
  - [ ] Autres schemas selon routes
- [ ] **Énums réutilisés:** `enum: FEATURE_ENUMS.status` (pas hardcoded)
- [ ] **Type validation:** `type: 'object'`, `type: 'string'`, etc.
- [ ] **Required fields:** `required: [...]` sur create/update
- [ ] **additionalProperties:** `false` sur tous schemas
- [ ] **Pas de logique:** Aucune fonction custom, helpers, ou middleware

### FeatureRoutes.js

- [ ] **File size:** < 100 lignes (configuration UNIQUEMENT)
- [ ] **Imports:**
  - [ ] `import { Router } from 'express'`
  - [ ] `import { FeatureController } from '../FeatureController.js'`
  - [ ] `import { FEATURE_VALIDATION_SCHEMAS } from '../FeatureValidation.js'` ✅
  - [ ] Controllers importés correctement
- [ ] **Middleware composition:**
  - [ ] `const mw = { base, read, write, update, delete }` object
  - [ ] `...mw.read` spread utilisé
  - [ ] `generalLimiter` dans `mw.base`
- [ ] **Route order:**
  - [ ] Routes spéciales (`/dashboard`, `/search`) AVANT `/:id`
  - [ ] CRUD routes après (`GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`)
- [ ] **Validation:**
  - [ ] `validateRequest(FEATURE_VALIDATION_SCHEMAS.xxx)` utilisé
  - [ ] **PAS de schémas inline** entre routes
  - [ ] **TOUS schemas importés** de FeatureValidation.js
- [ ] **Pagination:**
  - [ ] `paginationMiddleware()` sur GET /
  - [ ] Defaultlimit/maxLimit configuré
- [ ] **Pas d'erreurs courantes:**
  - [ ] ❌ Pas de logique métier dans routes
  - [ ] ❌ Pas de rate limiter custom (utilise generalLimiter)
  - [ ] ❌ Pas d'énums inline (utilise FEATURE_ENUMS)
  - [ ] ❌ Pas de schémas inline (utilise FEATURE_VALIDATION_SCHEMAS)

---

## Imports Corrects

### Migration Pattern

Quand vous **créez FeatureValidation.js**, les imports changent:

### 1️⃣ Dans `routes/featureRoutes.js`:

```javascript
// ❌ ANCIEN (schemas inline dans routes):
// const featureValidationSchemas = { ... };
// router.get('/', validateRequest(featureValidationSchemas.query), ...);

// ✅ NOUVEAU (schemas importés):
import { FEATURE_VALIDATION_SCHEMAS } from '../FeatureValidation.js';
router.get('/', validateRequest(FEATURE_VALIDATION_SCHEMAS.query), ...);
```

### 2️⃣ Dans `FeatureController.js` (si utilise schemas):

```javascript
// ✅ Peut importer pour validation métier (optionnel):
import { FEATURE_ENUMS } from '../FeatureValidation.js';

// Utilisation:
if (!FEATURE_ENUMS.status.includes(data.status)) {
  throw new Error('Status invalide');
}
```

### 3️⃣ Dans `FeatureService.js` (si besoin énums):

```javascript
// ✅ Peut importer énums pour validation:
import { FEATURE_ENUMS } from '../FeatureValidation.js';

// Utilisation:
const isValidStatus = FEATURE_ENUMS.status.includes(inputStatus);
```

---

## ❌ Erreurs Courantes À Repérer

### Erreur 1: Validation.js dans utils/

```javascript
// ❌ MAUVAIS:
server/features/template/utils/validation.js

// ✅ CORRECT:
server/features/template/FeatureValidation.js
```

### Erreur 2: Schemas encore dans routes.js

```javascript
// ❌ MAUVAIS (routes.js):
const featureValidationSchemas = {
  create: { body: { ... } },  // 100+ lignes ici !
  update: { body: { ... } },
  // ...
};

// ✅ CORRECT:
// Routes.js:
import { FEATURE_VALIDATION_SCHEMAS } from '../FeatureValidation.js';
router.get('/', validateRequest(FEATURE_VALIDATION_SCHEMAS.xxx), ...);
```

### Erreur 3: Enums hardcoded dans schemas

```javascript
// ❌ MAUVAIS:
status: { type: 'string', enum: ['active', 'inactive', 'pending'] }  // Hardcoded

// ✅ CORRECT:
status: { type: 'string', enum: FEATURE_ENUMS.status }  // Reference
```

### Erreur 4: Middleware ou logique dans Validation.js

```javascript
// ❌ TRÈS MAUVAIS (FeatureValidation.js):
export const customValidators = {
  validateEmail: (email) => regex.test(email),
  validateDate: (date) => dayjs(date).isValid()
};

export const mw = {
  read: [auth, limiter],
  write: [auth, limiter]
};

// ✅ NON inclua UNIQUEMENT schemas + enums:
export const FEATURE_ENUMS = { ... };
export const FEATURE_VALIDATION_SCHEMAS = { ... };
```

### Erreur 5: additionalProperties pas false

```javascript
// ❌ MAUVAIS:
body: {
  type: 'object',
  required: ['name'],
  properties: { name: {...} }
  // Manque additionalProperties: false
}

// ✅ CORRECT:
body: {
  type: 'object',
  required: ['name'],
  properties: { name: {...} },
  additionalProperties: false  // ✅ Empêche fields non prévus
}
```

### Erreur 6: Routes.js trop gros (> 100 lignes)

```javascript
// ❌ MAUVAIS (300+ lignes):
// - 200 lignes de schemas
// - 50 lignes de route definitions
// - 50 lignes de middleware config

// ✅ REFACTORISER:
// - FeatureValidation.js: 200 lignes (schemas + enums)
// - FeatureRoutes.js: < 50 lignes (routes uniquement)
```

---

## Étapes d'Analyse

1. **Localisation:** Vérifier feature/FeatureValidation.js existe
2. **Contenu Validation:** Scanner pour FEATURE_ENUMS + FEATURE_VALIDATION_SCHEMAS
3. **Contenu Routes:** Vérifier < 100 lignes, schemas importés
4. **Imports:** Chercher `import { FEATURE_VALIDATION_SCHEMAS } from '../FeatureValidation.js'`
5. **Middleware:** Vérifier `const mw = { base, read, write, ... }` object
6. **Route order:** Vérifier special routes AVANT `/:id`
7. **Validation:** Chercher `validateRequest(FEATURE_VALIDATION_SCHEMAS.xxx)`
8. **Erreurs:** Repérer schemas inline, logique métier, enums hardcoded

---

## Output Attendu

### 📋 PHASE 1 : ANALYSE PRÉALABLE (À VALIDER)

**AVANT de modifier**, présenter l'analyse comme ceci :

```
🔍 ANALYSE FEATURE: [FeatureName]

🗂️ État actuel:
  Fichier: /server/features/[feature]/routes/[feature]Routes.js
  Size: [X] lignes
  Enums: [Où sont-ils - inline dans routes? ailleurs?]
  Schemas: [Combien - dans routes ou séparés?]

📊 Breakdown lignes:
  - Imports: [X] lignes
  - Enums: [X] lignes
  - ValidationSchemas: [X] lignes
  - Middleware config: [X] lignes
  - Route definitions: [X] lignes

🔴 Problèmes identifiés:
  ❌ Enums sont inline dans routes.js (duplication possible)
  ❌ ValidationSchemas sont inline (300+ lignes!) 
  ❌ Routes.js [X] lignes (> 100 lignes)
  ✅ Routes order correct (special AVANT /:id)
  ✅ validateRequest() utilisé

📋 Plan de refactorisation:
  1. Créer [FeatureName]Validation.js à la racine
  2. Extraire [X] énums vers Validation.js
  3. Extraire [X] validation schemas vers Validation.js
  4. Mettre à jour imports dans routes.js
  5. Réduire routes.js de [X] → [Y] lignes

✅ Prêt à procéder ?
```

**Attendre la validation utilisateur AVANT de continuer** ✅

---

### ✅ SI CONFORME (Après refactorisation):

```
✅ FEATURE ROUTES & VALIDATION CONFORMES

Feature: template
Files:
  ✅ TemplateValidation.js créé à la racine
  ✅ templateRoutes.js refactorisé

FeatureValidation.js:
  ✅ TEMPLATE_ENUMS défini (status, priority, currency, sortFields, order)
  ✅ TEMPLATE_VALIDATION_SCHEMAS défini (create, update, query, advancedSearch)
  ✅ Énums utilisés dans schemas (enum: TEMPLATE_ENUMS.status)
  ✅ additionalProperties: false partout

TemplateRoutes.js:
  ✅ File size: 68 lignes (< 100)
  ✅ Imports corrects (schemas depuis FeatureValidation.js)
  ✅ Middleware composition object présent
  ✅ Routes special AVANT /:id ✅
  ✅ validateRequest par route
  ✅ Pas de logique métier détectée

Statut: CONFORME ✅
```

### 🟡 SI PARTIELLEMENT CONFORME:

```
✅ FEATURE ROUTES & VALIDATION CONFORMES

Feature: template
Files:
  ✅ TemplateValidation.js créé à la racine
  ✅ templateRoutes.js refactorisé

FeatureValidation.js:
  ✅ TEMPLATE_ENUMS défini (status, priority, currency, sortFields, order)
  ✅ TEMPLATE_VALIDATION_SCHEMAS défini (create, update, query, advancedSearch)
  ✅ Énums utilisés dans schemas (enum: TEMPLATE_ENUMS.status)
  ✅ additionalProperties: false partout

TemplateRoutes.js:
  ✅ File size: 68 lignes (< 100)
  ✅ Imports corrects (schemas depuis FeatureValidation.js)
  ✅ Middleware composition object présent
  ✅ Routes special AVANT /:id ✅
  ✅ validateRequest par route
  ✅ Pas de logique métier détectée

Statut: CONFORME ✅
```

### 🟡 SI PARTIELLEMENT CONFORME:

```
🟡 FEATURE ROUTES PARTIELLEMENT CONFORME

Feature: projects
Files:
  ✅ ProjectValidation.js créé
  ⚠️ projectsRoutes.js réduit mais encore 142 lignes

ProjectValidation.js:
  ✅ PROJECT_ENUMS défini
  ⚠️ MISSING: PROJECT_ENUMS.currency (utilisé dans schema)
  ✅ PROJECT_VALIDATION_SCHEMAS défini
  ✅ Énums référencés

ProjectRoutes.js:
  ❌ File size: 142 lignes (> 100)
  ✅ Imports corrects
  ✅ Middleware object présent
  ✅ Route order correct
  ⚠️ Middleware composition: mw.export présent (non standard)

Statut: À AMÉLIORER - Réduire routes.js à < 100 lignes
```

### ❌ SI NON-CONFORME:

```
❌ FEATURE ROUTES NON-CONFORMES

Feature: inspections
Files:
  ❌ MANQUE: InspectionsValidation.js
  ❌ inspectionsRoutes.js: 2152 lignes (!!)

Problèmes:
  ❌ Schemas inline dans routes.js (300+ lignes)
  ❌ Énums hardcoded dans routes.js
  ❌ Logique métier dans routes.js (Google Drive, Zoho)
  ❌ Routes mélangées (spécialisées pas en ordre)
  ❌ Pas d'enums centralisés

Action requise:
  1. Créer InspectionsValidation.js
  2. Extraire ALL schemas vers Validation.js
  3. Extraire logique métier vers controller/service
  4. Réorganiser routes (special AVANT /:id)
  5. Réduire inspectionsRoutes.js à < 100 lignes

Statut: NON-CONFORME ❌ - REFACTORISATION URGENTE
```

---

## Résumé des Changements

### D'une feature avec routes mal organisées:

```
AVANT (Mauvais):
features/template/
├── routes/
│   └── templateRoutes.js          (122 lignes)
│       ├─ 80 lignes: schemas
│       ├─ 22 lignes: mw config
│       └─ 20 lignes: routes
```

### À une feature bien structurée:

```
APRÈS (Bon):
features/template/
├── TemplateValidation.js          (80 lignes)
│   ├─ TEMPLATE_ENUMS
│   └─ TEMPLATE_VALIDATION_SCHEMAS
├── routes/
│   └── templateRoutes.js          (42 lignes)
│       ├─ 5 lignes: imports
│       ├─ 8 lignes: mw config
│       └─ 29 lignes: routes
```

**Bénéfices:**
- ✅ `templateRoutes.js` réduit de 122 → 42 lignes (-66%)
- ✅ Schemas testables unitairement
- ✅ Enums réutilisables partout
- ✅ Logique centralisée par responsabilité

---

## Validation Finale

Après refactoristion, tester:

```bash
# 1. Syntaxe valide
npm run build

# 2. Routes fonctionnent
curl http://localhost:3001/api/feature

# 3. Validation fonctionne
curl -X POST http://localhost:3001/api/feature \
  -H "Content-Type: application/json" \
  -d '{"invalid_field": "test"}' 
# Doit retourner erreur validation

# 4. Schemas corrects
npm test -- FeatureValidation.spec.js

# 5. Logs propres
tail -f server/logs/app.log
# No console.log, utilise Logger
```
