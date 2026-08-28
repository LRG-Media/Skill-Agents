# Checklist de Validation

Checklist complète à vérifier avant de considérer la feature comme terminée.

## Structure

- [ ] Dossier `models/` existe (obligatoire, même avec 1 fichier)
- [ ] Règle lean respectée (0-1 = racine, 2+ = sous-dossier)
- [ ] Pas de dossier `permissions/` (utiliser middleware central)
- [ ] Fichiers < 500 lignes

## Fichiers Obligatoires

- [ ] `index.js` avec barrel exports
- [ ] `README.md` documenté (objectif, endpoints, schéma, relations, flux, dépendances)
- [ ] `test.[feature].routes.mjs` fonctionnel
- [ ] `[Feature]Controller.js` avec les 5 helpers privés
- [ ] `[feature].service.js` avec Prisma queries
- [ ] `[feature].routes.js` avec `createRoutePresets`
- [ ] `[feature].validation.js` avec JSON Schema
- [ ] `models/[Feature].js` (business model class)
- [ ] `models/[Feature]Schema.js` (schema documentation)

## Code

- [ ] Aucun `console.*` dans le code (Logger uniquement)
- [ ] Tous les champs API en snake_case
- [ ] Soft delete : `status: 'deleted'` + `deleted_at` (jamais `prisma.*.delete()`)
- [ ] Filtre universel : `status: { not: 'deleted' }` dans tous les where
- [ ] Import prisma : `import { prisma } from '.../shared/database/prisma.js'`
- [ ] Export ESM : `export ...` (pas de `module.exports`)
- [ ] `req.user?.id` pour l'utilisateur (jamais `req.body.userId`)

## Routes & Permissions

- [ ] Routes spécifiques AVANT `/:id`
- [ ] `...mw.read` pour GET, `...mw.write` pour PUT, `...mw.manage` pour POST/DELETE
- [ ] `validateRequest(schema)` sur les routes qui reçoivent un body
- [ ] `paginationMiddleware()` sur les routes de liste
- [ ] Enregistré dans `apiRouteConfig.js`
- [ ] Portal config JSON mis à jour
- [ ] `portal-feature-dependencies.js` mis à jour (si custom)
- [ ] `wrapWithPortalFeatureGate` utilisé (si feature portal-spécifique)

## Prisma

- [ ] Migration exécutée : `npx prisma migrate dev --name add_xxx`
- [ ] Client généré : `npx prisma generate`
- [ ] Colonnes `id`, `created_at`, `updated_at`, `deleted_at` présentes
- [ ] Index sur colonnes de filtrage fréquent
- [ ] `@@schema()` défini si multi-schema
- [ ] Relations FK explicites

## Testing

- [ ] Tests passent : `node test.[feature].routes.mjs`
- [ ] Vérifier `server/logs/app.log` après exécution
- [ ] Chaque endpoint testé (GET list, GET by id, POST, PUT, DELETE)
- [ ] Authentification fonctionnelle (token frais)
- [ ] Validation des status codes (200, 201, 400, 404, 500)
