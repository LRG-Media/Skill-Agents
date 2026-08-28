# Étape 8 : Routes

Routes Express avec `createRoutePresets` pour les permissions et `validateRequest` pour la validation.

## Template

```js
// server/features/[domain]/[feature]/[feature].routes.js

import express from 'express';
import { CreditNoteController } from './CreditNoteController.js';
import { creditNoteValidationSchemas } from './credit-note.validation.js';
import { validateRequest, paginationMiddleware, createRoutePresets } from '../../../shared/middleware/index.js';

const router = express.Router();

// ═══ PERMISSIONS via createRoutePresets ═══
const mw = createRoutePresets({ permissionBase: 'credit_notes' });
// mw.read   → [limiter, authenticateToken, requirePermission('credit_notes.view')]
// mw.write  → [limiter, authenticateToken, requirePermission('credit_notes.edit')]
// mw.manage → [limiter, authenticateToken, requirePermission('credit_notes.manage')]

// ═══ ROUTES (spécifiques AVANT /:id) ═══
router.get('/',
  ...mw.read,
  validateRequest(creditNoteValidationSchemas.query),
  paginationMiddleware({ defaultLimit: 100, maxLimit: 500 }),
  CreditNoteController.getAll
);

router.get('/:id',
  ...mw.read,
  CreditNoteController.getById
);

router.post('/',
  ...mw.manage,
  validateRequest(creditNoteValidationSchemas.create),
  CreditNoteController.create
);

router.put('/:id',
  ...mw.write,
  validateRequest(creditNoteValidationSchemas.update),
  CreditNoteController.update
);

router.delete('/:id',
  ...mw.manage,
  CreditNoteController.delete
);

export default router;
```

## createRoutePresets

```js
import { createRoutePresets } from '../../../shared/middleware/index.js';

const mw = createRoutePresets({ permissionBase: 'credit_notes' });
```

| Preset | Permission Générée | Usage |
|--------|-------------------|-------|
| `mw.read` | `{base}.view` | GET list, GET by id |
| `mw.write` | `{base}.edit` | PUT update |
| `mw.manage` | `{base}.manage` | POST create, DELETE |
| `mw.custom('perm')` | `perm` custom | Usage spécial uniquement |

Chaque preset est un tableau de middleware : `[limiter, authenticateToken, requirePermission(...)]`.

## Règles Routes

| Règle | Détail |
|-------|--------|
| Ordre | Routes spécifiques AVANT `/:id` (ex: `/stats`, `/search`, `/dashboard`) |
| Permissions | `...mw.read` pour GET, `...mw.write` pour PUT, `...mw.manage` pour POST/DELETE |
| Validation | `validateRequest(schema)` après les permissions |
| Pagination | `paginationMiddleware({ defaultLimit, maxLimit })` pour les listes |
| Export | `export default router` (default export) |
| Limiter | Inclus dans createRoutePresets (pas besoin d'ajouter manuellement) |

## Route avec Sous-Routes

```js
// Si la feature a des sous-routes (ex: /:id/notes, /:id/history)
router.get('/:id/notes', ...mw.read, paginationMiddleware(), Controller.getNotes);
router.get('/:id/history', ...mw.read, Controller.getHistory);

// Toujours APRÈS les routes spécifiques sans /:id
router.get('/:id', ...mw.read, Controller.getById);
```

## Route Portal-Spécifique

```js
// Pour les features custom (portal-gated)
import { requirePortalAccess } from '../../../shared/middleware/portalAuth.js';

router.get('/', ...mw.read, requirePortalAccess('comuse'), Controller.getAll);
```

## Middleware Supplémentaires Disponibles

```js
import { generalLimiter, createLimiter } from '../../../shared/middleware/rateLimiter.js';

// Limiter personnalisé
const customLimiter = createLimiter({ windowMs: 60000, max: 50, prefix: 'credit-notes' });

router.post('/', ...mw.manage, validateRequest(schema), customLimiter, Controller.create);
```
