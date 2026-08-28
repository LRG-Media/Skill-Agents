# Anti-Patterns à Éviter

Tableau des erreurs courantes et leurs solutions correctes.

## Code

| ❌ Anti-Pattern | ✅ Pattern Correct |
|----------------|-------------------|
| `console.log(...)` | `Logger.info('MODULE', 'msg', data)` |
| `console.error(...)` | `Logger.error('MODULE', 'msg', data, error)` |
| `prisma.model.delete()` | `prisma.model.update({ data: { deleted_at: new Date(), status: 'deleted' } })` |
| `res.json({ ... })` | `res.successResponse(data, msg)` |
| `res.status(200).json(...)` | `res.successResponse(data, msg, { statusCode: 200 })` |
| `res.status(400).json(...)` | `res.errorResponse([{ code, message }], msg, 400)` |
| `req.body.userId` | `req.user?.id` (via authenticateToken) |
| `import prisma from '...'` | `import { prisma } from '.../shared/database/prisma.js'` |
| Créer `permissions/` dans la feature | Utiliser `createRoutePresets({ permissionBase })` |
| Fichier > 500 lignes | Découper par responsabilité |
| Champs camelCase dans API | Champs snake_case (`created_at`, `user_id`) |
| `routePresets.custom()` sans justification | Utiliser `mw.read/write/manage` standard |
| Controller → Controller (cross-feature) | Service → Service (jamais Controller → Controller) |
| Validation côté client uniquement | Toujours valider côté serveur aussi |
| `module.exports = ...` | `export ...` (ESM uniquement) |

## Structure

| ❌ Anti-Pattern | ✅ Pattern Correct |
|----------------|-------------------|
| Dossier `permissions/` dans la feature | Middleware central `shared/middleware/permissions.js` |
| `utils/` avec 1 fichier | Rester à la racine, créer le dossier à 2+ fichiers |
| `controllers/` avec 1 fichier | Rester à la racine avec `[Feature]Controller.js` |
| `services/` avec 1 fichier | Rester à la racine avec `[feature].service.js` |
| `routes/` avec 1 fichier | Rester à la racine avec `[feature].routes.js` |
| Pas de `models/` | `models/` est TOUJOURS un dossier (exception à la règle lean) |
| Pas de `README.md` | README.md obligatoire à la racine de la feature |
| Pas de test | `test.[feature].routes.mjs` obligatoire |

## Sécurité

| ❌ Anti-Pattern | ✅ Pattern Correct |
|----------------|-------------------|
| Token en dur dans le code | Token frais via login (workflow Fresh Token) |
| Pas de validation des inputs | `validateRequest(schema)` sur chaque route |
| Pas de rate limiting | `createRoutePresets` inclut le limiter |
| `additionalProperties: true` | `additionalProperties: false` dans les schemas |
| SQL injection via raw query | Toujours utiliser Prisma Client (pas de `$queryRaw` sauf justifié) |
| Log des mots de passe | Jamais logger les secrets/champs sensibles |
| `NODE_ENV=production` en dev | Vérifier `.env` ou portal config |

## Performance

| ❌ Anti-Pattern | ✅ Pattern Correct |
|----------------|-------------------|
| N+1 queries (boucle + findUnique) | `findMany({ where: { id: { in: ids } } })` |
| Pas de pagination | `paginationMiddleware()` + `take/skip` |
| `SELECT *` explicite | `select: { id: true, name: true }` (champs nécessaires) |
| Requête dans une boucle | Batch avec `Promise.all()` ou `findMany({ where: { in: [...] } })` |
| Pas de cache pour données stables | `cacheService.set(key, data, ttl)` |
| Logger.info sur chaque requête | Logger.info uniquement sur actions métier importantes |
