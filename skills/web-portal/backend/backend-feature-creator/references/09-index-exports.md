# Étape 9 : Index.js (Barrel Exports)

Fichier d'exports central de la feature.

## Template

```js
// server/features/[domain]/[feature]/index.js

// Routes (default export → named)
export { default as creditNotesRoutes } from './credit-note.routes.js';

// Controller
export { CreditNoteController } from './CreditNoteController.js';

// Service
export { CreditNoteService } from './credit-note.service.js';

// Models
export { CreditNote } from './models/CreditNote.js';
export { CreditNotesSchema } from './models/CreditNotesSchema.js';
```

## Variantes selon la Taille

### Feature Complète (recommandé)

```js
export { default as creditNotesRoutes } from './credit-note.routes.js';
export { CreditNoteController } from './CreditNoteController.js';
export { CreditNoteService } from './credit-note.service.js';
export { CreditNote } from './models/CreditNote.js';
export { CreditNotesSchema } from './models/CreditNotesSchema.js';
```

### Feature Minimale (routes only)

```js
export { default as leadsRoutes } from './lead.routes.js';
```

### Feature avec Sous-Dossiers

```js
// Feature avec controllers/, services/, routes/ séparés
export { default as tasksRoutes } from './routes/tasksRoutes.js';
export { TaskController } from './controllers/index.js';
export { TaskService } from './services/index.js';
```

## Règles Exports

| Règle | Détail |
|-------|--------|
| Routes | Toujours `export { default as xxxRoutes }` (default → named) |
| Controller | `export { FeatureController }` |
| Service | `export { FeatureService }` |
| Models | `export { Feature }` + `export { FeaturesSchema }` |
| Pas d'alias | Ne pas créer d'alias legacy dans les exports |
| Pas d'import circulaire | Les sous-dossiers ne doivent pas importer depuis l'index racine |
| Sous-dossier index | Chaque sous-dossier avec 2+ fichiers a son propre `index.js` |

## Import dans apiRouteConfig.js

```js
// server/routes/apiRouteConfig.js
import { creditNotesRoutes } from '../features/finance/credit-notes/index.js';

// ou directement :
import creditNotesRoutes from '../features/finance/credit-notes/credit-note.routes.js';
```
