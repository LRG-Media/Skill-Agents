---
name: server-feature-optimization
description: 'Auditer une feature backend server pour: performance (N+1, batch, preload), sécurité (injection, auth, validation), taille des fichiers, memory leaks, et concurrency. Skill d''analyse uniquement — retourne un rapport avec les problèmes et recommandations.'
argument-hint: 'Donne le chemin de la feature ou du fichier à auditer. Optionnellement : un pilier (perf, security, size, memory, concurrency, errors, arch, complexity, maintainability) ou "quick wins" pour un résumé rapide.'
user-invocable: true
---

# Server Feature Optimization — Audit

## Objectif

**Analyser** une feature backend `server/features/` et produire un **rapport d'audit** avec les problèmes trouvés et les recommandations. Ce skill est en **lecture seule** : il identifie les problèmes mais n'applique pas les corrections.

## Quand Utiliser

Invoquer ce skill quand :
- Auditer une feature existante pour des problèmes de perf, sécurité ou mémoire
- Vérifier la qualité du code avant un merge ou un déploiement
- Diagnostiquer un ralentissement ou un crash (memory leak, N+1, etc.)
- Évaluer la maintenabilité d'un fichier volumineux

**Ne pas utiliser** pour :
- Créer une nouvelle feature (utiliser `backend-feature-structure`)
- Appliquer des corrections (le skill retourne uniquement un rapport)

---

## WORKFLOW D'AUDIT

### Étape 0 — Registry check
Lire `AUDIT-REGISTRY.md` dans le dossier du skill (`server-feature-optimization/`). Vérifier si la feature cible y figure :
- **Absente** → continuer l'audit complet
- **Analysée < 30 jours** → proposer un `quick win` sauf si l'utilisateur demande explicitement un audit complet
- **Analysée > 90 jours** → recommander un ré-audit complet
- **Analysée 30-90 jours** → audit complet si l'utilisateur le demande, sinon signaler le dernier score

### Étape 1 — Ciblage
L'utilisateur fournit un chemin de feature ou de fichier. Si c'est une feature complète, lister tous les fichiers `.js` dans le dossier.

### Étape 2 — Scan de taille
Pour chaque fichier, compter les lignes. Flaguer ceux qui dépassent les seuils :
| Type de fichier | Warning | Critique |
|---|---|---|
| Service | > 300 lignes | > 500 lignes |
| Controller | > 100 lignes | > 200 lignes |
| Route | > 50 lignes | > 100 lignes |
| Job scheduler | > 200 lignes | > 300 lignes |
| Tout autre | > 300 lignes | > 500 lignes |

### Étape 2b — Scan de structure
Vérifier la conformité structurelle (basé sur `backend-feature-structure`) :
- [ ] `models/` dossier existe (obligatoire même avec 1 fichier)
- [ ] `test.[feature].routes.mjs` existe à la racine de la feature
- [ ] `README.md` existe à la racine de la feature
- [ ] Chaque sous-dossier a un `index.js`
- [ ] Pas de dossier `permissions/` (tout passe par le middleware central)
- [ ] Fichiers au bon endroit (racine si 1 fichier, sous-dossier si 2+)

### Étape 3 — Scan par pilier
Appliquer les règles de chaque pilier (voir ci-dessous) et lister les violations trouvées avec le fichier et la ligne approximative. Inclure le scan de complexité (imbrication, taille des fonctions) et de maintenabilité (code mort, TODO, noms).

### Étape 4 — Rapport
Générer le rapport au format standard (voir section "Format du Rapport").

### Étape 5 — Mise à jour du registry
Après l'audit, mettre à jour `AUDIT-REGISTRY.md` (même dossier que ce skill) :
- **Feature nouvelle** : ajouter une ligne avec le chemin, la date du jour, le score global, le nombre de violations et un résumé
- **Feature déjà présente** : mettre à jour la ligne existante avec la nouvelle date, le nouveau score et un résumé des changements
- Si des quick wins ont été appliqués entre-temps, noter l'amélioration dans les notes

Format de la ligne :
```
| `feature/path` | YYYY-MM-DD | X/10 | N critiques, N warnings | Agent | Résumé court |
```

**Faux positifs** : si une violation n'est pas applicable (exception documentée, pattern volontaire), l'annoter dans les notes avec le préfixe `FP:` :
```
| `feature/path` | YYYY-MM-DD | 8/10 | 1 critique, 2 warnings | Copilot | FP: injection champ = pattern projet validé |  ```

### Étape 6 — Modifications de schéma (si applicable)
Si l'audit révèle des problèmes d'index ou de structure de données :
- **Ne jamais modifier** les fichiers `.prisma` directement
- Modifier le `*.schema.js` dans le dossier `models/` de la feature
- Le schéma Prisma sera régénéré automatiquement
- Vérifier les `@@index` dans le schéma JS (section `indexes`)
- Tester la migration : `npx prisma migrate dev --name description`

### Étape 7 — Skills complémentaires (post-audit)
Après l'audit, si des corrections sont appliquées :
- Invoquer le skill `changelog-updater` pour documenter les changements
- Si des tests sont nécessaires, suivre le workflow de validation du `local-validation-orchestrator`
- Mettre à jour ce skill si de nouvelles conventions sont découvertes pendant l'audit

---

## PILIER 1 — PERFORMANCE

### Règles à vérifier

| # | Règle | Comment détecter |
|---|---|---|
| 1.1 | **Zéro N+1** : aucune requête Prisma dans une boucle `for/forEach/map` | Chercher `await prisma.` à l'intérieur d'un `for`, `forEach`, ou `.map(async` |
| 1.2 | **Batch writes** : `createMany` ou `$transaction` au lieu de N inserts/updates individuels | Chercher `prisma.X.create` ou `prisma.X.update` dans une boucle |
| 1.3 | **Batch reads** : `$transaction` pour plusieurs lectures simultanées | Plusieurs `await prisma.X.findMany` consécutifs non dépendants |
| 1.4 | **Fenêtrage temporel** : toute requête historique a un filtre date | `findMany` sans `gte`/`lte` sur une colonne de date |
| 1.5 | **Select strict** : pas de `include: *` ou select trop large | `include:` sans spécifier les champs, ou `select` avec des champs non utilisés |
| 1.6 | **Pagination** : toute route list a `page`/`limit` | Route GET list sans paramètres de pagination |
| 1.7 | **Index** : les colonnes filtrées frequent ont un index Prisma | `where` sur des colonnes sans `@@index` correspondant |
| 1.8 | **findMany borné** : toute table de données a `take` ou pagination | `findMany` sans `take` sur des tables de données (pas config/lookup)
| 1.9 | **Index couverture** : vérifier `@@index` dans le schema Prisma contre les `where` fréquents | `where` sur `[entity_type, entity_id]` sans `@@index` dans le schema

### Patterns d'erreur

```js
// 🔴 N+1 — requête dans une boucle
for (const sub of subscriptions) {
  const invoices = await prisma.invoices.findMany({ where: { user_id: sub.id } });
}

// 🔴 Batch manqué — N inserts individuels
for (const item of items) {
  await prisma.logs.create({ data: item });
}

// 🔴 Pas de fenêtre temporelle
const all = await prisma.invoices.findMany({ where: { status: 'draft' } });

// 🔴 Select trop large
const subs = await prisma.subscriptions.findMany({ include: { users: true, accounts: true } });
```

---

## PILIER 2 — SÉCURITÉ

> **Conventions du projet** : La validation se fait **dans le service** avec `parseInt`/`isNaN`/normalisation manuelle. Aucune feature n'utilise Zod/Joi sur les routes. Ne pas recommander l'ajout de Zod — c'est un pattern non adopté par le projet. Vérifier que les champs entrants sont filtrés (extraction des seuls champs attendus) pour éviter l'injection de champs non prévus.

### Règles à vérifier

| # | Règle | Comment détecter |
|---|---|---|
| 2.1 | **Filtrage des champs** : le service extrait uniquement les champs attendus du payload | `req.body` ou `payload` passé tel quel à Prisma `data` sans extraction des clés |
| 2.2 | **Validation des types** : `parseInt`/`isNaN` sur les IDs, normalisation sur les enums | Payload sans vérification de type avant usage dans une requête |
| 2.3 | **Pas d'injection SQL** : jamais de string interpolation dans `$queryRaw` | `${variable}` dans un template Prisma raw |
| 2.4 | **Ownership check** : le service vérifie `user_id = context.userId` | `findUnique` sans filtre user_id sur des données privées |
| 2.5 | **Sanitization** : inputs utilisateur tronqués/sanitisés avant stockage | `req.body.X` stocké directement sans `String().slice().replace()` |
| 2.6 | **Logs sans secrets** : pas de password, token, ou données sensibles dans Logger | Logger avec `password`, `token`, `secret`, `authorization` |
| 2.7 | **Rate limiting** : routes sensibles (auth, billing, email) ont un rate limit dédié | Routes auth/billing/email sans `authLimiter` ou `createLimiter`. Note : le `generalLimiter` via `createRoutePresets` couvre les autres routes |
| 2.8 | **Soft deletes** : requêtes filtrent `deleted_at: null` | `findUnique`/`findMany` sans `deleted_at: null` sur des modèles avec soft delete. **Exception** : `users` utilise `status: 'deleted'` pas `deleted_at` |

### Patterns d'erreur

```js
// 🔴 Injection de champs — payload passé tel quel
await prisma.notes.create({ data: payload });
// ✅ Filtrage correct
await prisma.notes.create({
  data: {
    title: String(payload.title || '').slice(0, 255).trim() || null,
    content: String(payload.content || '').slice(0, 50000).trim() || null,
    resource_type: String(payload.resource_type || '').slice(0, 80).trim() || null,
    status: normalizedStatus
  }
});

// 🔴 Injection SQL
await prisma.$queryRaw`SELECT * FROM users WHERE name = '${userInput}'`;

// 🔴 Pas de ownership check
const invoice = await prisma.invoices.findUnique({ where: { id: invoiceId } });

// 🔴 Log avec secret
Logger.info('AUTH', 'Login', { email, password: req.body.password });

// 🔴 Input non sanitizé
await prisma.notes.create({ data: { content: req.body.content } });

// 🔴 Soft delete ignoré
const subs = await prisma.subscriptions.findMany({ where: { user_id: userId } });
```

---

## PILIER 3 — TAILLE DES FICHIERS

### Règles à vérifier

| # | Règle | Comment détecter |
|---|---|---|
| 3.1 | **300 lignes max** par fichier | `wc -l` ou compteur de lignes |
| 3.2 | **Pas de duplication** : même logique dans > 1 fichier | Patterns de code similaires entre fichiers |
| 3.3 | **Pas de magic numbers** : constantes centralisées | Nombres littéraux dans les conditions (`>= 3`, `> 5`, etc.) |
| 3.4 | **Controller mince** : < 30 lignes par endpoint | Controller avec de la logique métier |
| 3.5 | **README** : chaque feature > 3 fichiers a un README | Absence de `README.md` dans le dossier feature |

### Seuils

| Type | OK | Warning | Critique |
|---|---|---|---|
| Service | < 300 | 300-500 | > 500 |
| Controller | < 100 | 100-200 | > 200 |
| Route | < 50 | 50-100 | > 100 |
| Job | < 200 | 200-300 | > 300 |

---

## PILIER 4 — MÉMOIRE

### Règles à vérifier

| # | Règle | Comment détecter |
|---|---|---|
| 4.1 | **Fenêtrage** : chargements sans limite de date | `findMany` sans filtre `gte` sur date |
| 4.2 | **Cleanup** : Maps/arrays > 1000 éléments vidés après usage | `new Map()` ou `[]` sans `.clear()` ou `.length = 0` |
| 4.3 | **JSON volumineux** : champ Json chargé sans nécessité | `select: { line_items: true }` alors qu'on utilise pas le contenu |
| 4.4 | **Pas de closure inter-exécutions** : variable module qui retient des données | `let cache = null` au scope module dans un cron job |
| 4.5 | **Streaming** : datasets > 5000 lignes traités par batches | `findMany` sans `take` sur une table potentiellement grosse |
| 4.6 | **Cache module-level** : tout cache au scope module a un cleanup | `new Map()` ou `new Set()` au scope module sans TTL, `clear()`, ou `delete()` périodique |

### Patterns d'erreur

```js
// 🔴 Chargement sans fenêtre
const allLogs = await prisma.logs.findMany({ where: { action: 'LOGIN' } });

// 🔴 Map jamais vidée
const cache = new Map();
// ... 500 entrées ajoutées ...
// pas de cache.clear()

// 🔴 Variable module qui grossit
let previousResults = [];
const handler = async () => {
  previousResults = await process(); // ← fuite entre exécutions
};

// 🔴 JSON chargé pour un simple filtre
const invoices = await prisma.invoices.findMany({
  select: { id: true, line_items: true }  // line_items = gros JSON
});
// mais on ne fait que .filter() dessus
```

---

## PILIER 5 — CONCURRENCY

### Règles à vérifier

| # | Règle | Comment détecter |
|---|---|---|
| 5.1 | **Lock d'exécution** : cron jobs ont un mutex/guard | Cron handler sans vérification de double exécution |
| 5.2 | **Transactions atomiques** : opérations multi-tables dans `$transaction` | Plusieurs writes indépendants sans transaction |
| 5.3 | **Timeout** : appels externes (Zoho, Google Drive, email) ont un timeout explicite | `await axios.post()` ou `await axios.get()` sans `timeout` dans la config. Pattern OK : `await axios({ ..., timeout: 10000 })` ou `ZohoApiClient` (a 15s intégré) |
| 5.4 | **Race condition** : lecture-écriture concurrente sur la même ressource | Lecture puis écriture sans verrou ni transaction |
| 5.5 | **Transactions multi-écritures** : plusieurs writes Prisma consécutifs dans `$transaction` | Plusieurs `prisma.X.create/update/delete` sans `$transaction` — risque d'écriture partielle |

### Patterns d'erreur

```js
// 🔴 Pas de lock — double exécution possible
let cronTask = null;
export const handler = async () => {
  // si le cron tourne en double, tout est fait 2×
};

// 🔴 Pas de transaction — écritures partielles
await prisma.invoices.create({ data: invoiceData });
await prisma.subscriptions.update({ where: { id: subId }, data: { status: 'billed' } });
// si le 2ème échoue, la facture existe mais le sub n'est pas mis à jour

// 🔴 Pas de timeout — crash silencieux
const pdf = await generatePdf(invoiceId); // peut tourner indéfiniment
```

---

## PILIER 6 — ERREURS

### Règles à vérifier

| # | Règle | Comment détecter |
|---|---|---|
| 6.1 | **Pas de catch silencieux** : les erreurs sont loggées | `catch (e) { }` vide ou `catch { return null; }` |
| 6.2 | **Codes d'erreur cohérents** : les strings throw dans le service doivent matcher le controller | Service `throw new Error('NOTE_NOT_FOUND')` sans correspondant `if (error.message === ...)` dans le controller |
| 6.3 | **Contexte suffisant** : erreurs loggées avec l'ID et le contexte | `Logger.error('Erreur', { error: e.message })` sans entity_id |
| 6.4 | **Pas de catch silencieux redirigé** : les erreurs non gérées remontent avec un code 500 | Catch qui retourne `res.errorResponse` avec un message générique masquant le vrai problème |
| 6.5 | **Timeout externe** : appels Zoho, Google Drive, email ont un timeout | `await externalService.call()` sans `Promise.race` ou timeout |

---

## FORMAT DU RAPPORT

Retourner systématiquement le rapport suivant :

```markdown
# Audit Report — [nom-feature]

**Date** : YYYY-MM-DD
**Fichiers analysés** : N
**Mode** : [audit complet | quick win | perf | security | size | memory]

## Score Global : X/10

| Pilier | Score | Problèmes |
|---|---|---|
| Performance | X/10 | N violations |
| Sécurité | X/10 | N violations |
| Taille | X/10 | N fichiers > seuil |
| Mémoire | X/10 | N risques |
| Concurrency | X/10 | N risques |
| Erreurs | X/10 | N violations |
| Architecture | X/10 | N violations |
| Complexité | X/10 | N fonctions trop longues/imbriquées |
| Maintenabilité | X/10 | N code mort / TODO anciens |

## Structure de la Feature

| Élément | Présent | État |
|---|---|---|
| models/ | ✅/❌ | Obligatoire |
| test.[feature].routes.mjs | ✅/❌ | Obligatoire |
| README.md | ✅/❌ | Recommandé |
| index.js (racine) | ✅/❌ | Obligatoire |

## Fichiers Analysés

| Fichier | Lignes | État |
|---|---|---|
| service.js | 420 | 🔴 > 300 |
| controller.js | 85 | ✅ OK |
| routes.js | 120 | 🟡 > 100 |

## Violations Trouvées

### 🔴 Critiques (à corriger immédiatement)
1. **N+1** — `service.js` L145 : requête `prisma.invoices.findMany` dans une boucle `for`
2. **Injection** — `controller.js` L30 : `${search}` dans `$queryRaw`

### 🟡 Warnings (à améliorer)
1. **Pas de fenêtre** — `service.js` L200 : chargement sans filtre date
2. **Fichier volumineux** — `service.js` : 420 lignes (seuil 300)

### 🟢 Info (bonnes pratiques)
1. README manquant dans le dossier feature

## Quick Wins (top 3 corrections à fort impact)
1. Pré-charger les invoices en dehors de la boucle (gain : N requêtes → 1)
2. Ajouter `deleted_at: null` sur le `findUnique` du service (sécurité)
3. Fenêtrer le chargement à 90 jours (mémoire)

## Recommandations Détaillées
[pour chaque violation, donner le fichier, la ligne, le code actuel, et le code corrigé]
```

---

## MÉTHODOLOGIE DE SCORING

Chaque pilier est noté de 0 à 10 :

| Violations | Score |
|---|---|
| 0 violation | 10/10 |
| 1 warning | 9/10 |
| 2 warnings | 8/10 |
| 3 warnings ou 1 critique | 7/10 |
| 4-5 warnings ou 2 critiques | 6/10 |
| 6+ warnings ou 3+ critiques | ≤ 5/10 |

**Score global** = moyenne des 9 piliers (Performance, Sécurité, Taille, Mémoire, Concurrency, Erreurs, Architecture, Complexité, Maintenabilité).

Arrondi à l'entier le plus proche. Minimum 0.

---

## EXEMPLE DE RAPPORT

```markdown
# Audit Report — communication/notes

**Date** : 2026-08-13
**Fichiers analysés** : 5
**Mode** : audit complet

## Score Global : 8/10

| Pilier | Score | Problèmes |
|---|---|---|
| Performance | 7/10 | 1 warning |
| Sécurité | 9/10 | 0 violation |
| Taille | 6/10 | 1 critique |
| Mémoire | 8/10 | 1 warning |
| Concurrency | 9/10 | 0 violation |
| Erreurs | 8/10 | 1 warning |
| Architecture | 8/10 | 1 warning (ActivityLogManager) |
| Complexité | 10/10 | 0 violation |
| Maintenabilité | 9/10 | 0 violation |

## Structure de la Feature

| Élément | Présent | État |
|---|---|---|
| models/ | ✅ | Obligatoire |
| test.notes.routes.mjs | ❌ | Obligatoire |
| README.md | ✅ | Recommandé |
| index.js (racine) | ✅ | Obligatoire |

## Fichiers Analysés

| Fichier | Lignes | État |
|---|---|---|
| noteService.js | 420 | 🔴 > 300 |
| noteController.js | 85 | ✅ OK |
| noteRoutes.js | 120 | 🟡 > 100 |

## Violations Trouvées

### 🔴 Critiques (à corriger immédiatement)
1. **Fichier volumineux** — `noteService.js` : 420 lignes (seuil warning 300, critique 500)

### 🟡 Warnings (à améliorer)
1. **Pas de fenêtre** — `noteService.js` L200 : `findMany` sans filtre `gte` sur `created_at`
2. **Pas de transaction** — `noteService.js` L145 : 2 writes consécutifs sans `$transaction`
3. **Route > 50 lignes** — `noteRoutes.js` : 120 lignes (seuil 100)
4. **ActivityLogManager absent** — `noteController.js` : create/update/delete sans log
5. **Test manquant** — `test.notes.routes.mjs` absent

### 🟢 Info (bonnes pratiques)
1. README présent et à jour

## Quick Wins (top 3 corrections à fort impact)
1. Fenêtrer `getAccountNotesWithRelated` à 90 jours (mémoire + perf)
2. Ajouter `$transaction` sur create+update dans `noteService.js` (atomicité)
3. Déplacer les routes CRUD dans un sous-dossier `routes/` (taille)

## Recommandations Détaillées

### 1. Fenêtrage temporel (noteService.js L200)
```js
// ❌ Actuel
const notes = await prisma.notes.findMany({ where: { account_id: accountId } });

// ✅ Corrigé
const notes = await prisma.notes.findMany({
  where: {
    account_id: accountId,
    created_at: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
  }
});
```

### 2. Transaction manquante (noteService.js L145)
```js
// ❌ Actuel
await prisma.notes.create({ data: noteData });
await prisma.accounts.update({ where: { id: accountId }, data: { notes_count: { increment: 1 } } });

// ✅ Corrigé
await prisma.$transaction([
  prisma.notes.create({ data: noteData }),
  prisma.accounts.update({ where: { id: accountId }, data: { notes_count: { increment: 1 } } })
]);
```
```

---

## MODE QUICK WIN

Si l'utilisateur demande "quick wins" ou "rapide", retourner uniquement :
1. Les 3-5 violations les plus critiques (impact × facilité de correction)
2. Le code corrigé pour chacune
3. Pas de rapport complet

---

## PILIER 7 — ARCHITECTURE (Conformité projet)

### Règles à vérifier

| # | Règle | Comment détecter |
|---|---|---|
| 7.1 | **Inter-feature** : controllers appellent uniquement leurs services locaux | Controller qui importe un service d'une autre feature (`import ... from '../../../other-feature/'`) |
| 7.2 | **Services partagés** : integrations via `ResourceIntegrationService`, files via `FilesService`, notes via `NoteService` | Appel direct à `prisma.integrations`, `prisma.files`, `prisma.notes` dans une feature |
| 7.3 | **ActivityLogManager** : les événements CRUD core (accounts, contacts, projects, tasks, appointments) utilisent `ActivityLogManager.logEvent` | Événement create/update/delete sur une entité core sans appel à `ActivityLogManager`. Note : features utilitaires (chats, scheduler, backups) et features secondaires (leads, payments) ne l'utilisent pas toujours — documenter dans le README si non implémenté |
| 7.4 | **Services pures** : les services retournent des données business, pas de formatage réponse | Service qui fait `res.json()` ou formatage de réponse API |
| 7.5 | **models/ obligatoire** : chaque feature a un dossier `models/` | Absence du dossier `models/` |
| 7.6 | **Test obligatoire** : chaque feature a `test.[feature].routes.mjs` | Absence du fichier de test |
| 7.7 | **index.js** : chaque sous-dossier a un `index.js` | Sous-dossier sans export |
| 7.8 | **Logger** : uniquement `Logger.js`, jamais `console.*` dans le code applicatif (test files exclus) | `console.log`, `console.error`, etc. dans un service/controller/route. **Convention** : `import Logger from` (majuscule) est le standard du projet |
| 7.9 | **responseOptimizer** : pas d'import manuel dans les routes | Import de `responseOptimizer` dans un fichier route (appliqué globalement dans server.js) |
| 7.10 | **Controller v2.0** : les controllers récents ont des helpers privés `#getContext`, `#validateId`, `#handleError` | Nouveau controller sans ces helpers — vérifier la cohérence avec les controllers existants |

### Règles de complexité

| Critère | OK | Warning | Critique |
|---|---|---|---|
| Indentation max | ≤ 3 | 4 | ≥ 5 |
| Lignes par fonction | ≤ 40 | 40-60 | > 60 |
| Paramètres par fonction | ≤ 4 | 5 | ≥ 6 |
| Branches par fonction | ≤ 8 | 8-12 | > 12 |

### Règles de maintenabilité

| Critère | OK | Warning | Critique |
|---|---|---|---|
| Code mort (exports inutilisés) | 0 | 1-2 | ≥ 3 |
| TODO/FIXME > 30 jours | 0 | 1-2 | ≥ 3 |
| Littéraux dans conditions | 0 | 1-3 | ≥ 4 |
| Noms cryptiques (1-2 lettres) | 0 | 1-2 | ≥ 3 |

---

## CONVENTIONS DU PROJET (à toujours vérifier)

### Imports
```js
// ✅ Correct
import { prisma } from '../../../shared/database/prisma.js';
import Logger from '../../../../shared/logging/Logger.js';

// ❌ Interdit
import { getPrisma } from '../../../shared/database/prisma.js'; // deprecated
```

### Soft deletes
```js
// ✅ Toujours filtrer (16 modèles : accounts, appointments, contacts, emails, invoices, leads, notes, payments, projects, quotes, subscriptions, tasks, taxes, time_entries, chats, settings)
where: { id, deleted_at: null }

// ✅ Exception users : utilise status = 'deleted' pas deleted_at
where: { id, status: { not: 'deleted' } }

// ❌ Jamais ignorer
where: { id }  // sur un modèle avec deleted_at
```

### Réponses API
```js
// ✅ Utiliser les helpers existants
res.successResponse(data);
res.listResponse(items, total, page, limit);
res.errorResponse(message, statusCode);
```

### Snake case
Toutes les clés de réponse API sont en `snake_case` : `created_at`, `user_id`, `is_active`.

### Modification de schéma Prisma

> **Règle absolue** : Ne jamais modifier les fichiers `.prisma` directement (`server/prisma/schema/*.prisma`). Ces fichiers sont **générés automatiquement** à partir des schémas JS.

**Workflow correct :**
1. Modifier le fichier `*.schema.js` dans le dossier `models/` de la feature concernée
2. Le schéma Prisma sera régénéré lors du prochain build/migration

**Exemple avec NotesSchema.js :**
```js
// ✅ Modifier ICI — models/NotesSchema.js
static BASE_SCHEMA = {
  notes: {
    id: { type: 'Int', primary: true, autoIncrement: true },
    title: { type: 'String', maxLength: 255, nullable: true },
    // ... ajouter/modifier un champ ici
    new_field: { type: 'String', nullable: true },
    indexes: [
      ['resource_type', 'resource_id'],
      ['new_field']  // ajouter l'index ici aussi
    ]
  }
};

// ❌ Ne PAS modifier directement server/prisma/schema/notes.prisma
```

**Structure d'un champ dans le schéma JS :**
```js
{
  type: 'String',        // Type Prisma : String, Int, Float, Boolean, DateTime, Json, Enum
  maxLength: 255,        // Optionnel — limite taille
  nullable: true,        // Optionnel — champ nullable
  default: 'value',      // Optionnel — valeur par défaut
  primary: true,         // Optionnel — clé primaire
  autoIncrement: true,   // Optionnel — auto-incrément
  updatedAt: true,       // Optionnel — champ mis à jour automatiquement
  db: 'VarChar(255)'    // Optionnel — type DB spécifique
}
```

**Enum dans le schéma JS :**
```js
static ENUMS = {
  NoteStatus: ['draft', 'completed', 'published']  // Crée l'enum Prisma
};
```

**Index dans le schéma JS :**
```js
indexes: [
  ['field1', 'field2'],     // Index composé
  ['field3'],               // Index simple
  ['field4', 'field5']      // Un autre index composé
]
```

**Vérification post-modification :**
- Le fichier `.prisma` doit refléter le schéma JS après régénération
- Vérifier que les `@@index` sont bien dans le modèle Prisma
- Tester la migration avec `npx prisma migrate dev --name description`