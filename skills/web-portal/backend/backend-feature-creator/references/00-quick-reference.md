# Quick Reference — Patterns Rapides

## Service Import Pattern
```js
import { prisma } from '../../../shared/database/prisma.js';
import Logger from '../../../shared/logging/Logger.js';
import { ModuleFieldsService } from '../../system/settings/services/ModuleFieldsService.js';
```

## Controller 5 Helpers
```js
static #getContext = (req) => ({ portal: req.portal, userId: req.user?.id, user: req.user, userRole: req.user?.role });
static #validateId = (id) => { /* parseInt + isNaN check */ };
static #createMeta = (context, extras = {}) => ({ portal, user_id, user_role, ...extras });
static #handleError = (res, code, msg, status, error, ctx) => { Logger.error + res.errorResponse };
static #executeOperation = async (req, res, name, method, msg, opts) => { try/catch wrapper };
```

## Routes Permission Pattern
```js
const mw = createRoutePresets({ permissionBase: 'credit_notes' });
router.get('/', ...mw.read, Controller.getAll);       // .view
router.post('/', ...mw.manage, Controller.create);    // .manage
router.put('/:id', ...mw.write, Controller.update);   // .edit
router.delete('/:id', ...mw.manage, Controller.delete); // .manage
```

## Response Methods
```js
res.successResponse(data, message, { statusCode, meta });
res.listResponse(items, { total, page, limit, pages, has_more }, { meta });
res.errorResponse([{ code, message }], message, statusCode);
```

## Soft Delete Pattern
```js
// Service — jamais prisma.*.delete()
await prisma.model.update({ where: { id }, data: { deleted_at: new Date(), status: 'deleted' } });
// Filtre universel
{ status: { not: 'deleted' } }
```

## API Registration
```js
// server/routes/apiRouteConfig.js
'credit-notes': { router: creditNotesRoutes, options: { compatibility: true } }
// Custom portal-gated :
'my-feature': { router: wrapWithPortalFeatureGate(myRoutes, 'my_feature'), options: { compatibility: true } }
```
