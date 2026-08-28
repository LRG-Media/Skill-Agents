# Étape 12 : Enregistrement API & Permissions

Enregistrer les routes dans `apiRouteConfig.js` et configurer les permissions.

## 12a. Enregistrer les Routes

```js
// server/routes/apiRouteConfig.js

import { creditNotesRoutes } from '../features/finance/credit-notes/index.js';

export const API_ROUTES_CONFIG = {
  // ... existing routes
  'credit-notes': {
    router: creditNotesRoutes,
    options: { compatibility: true, description: 'Credit notes management' }
  },
};
```

### Feature Standard

```js
'credit-notes': {
  router: creditNotesRoutes,
  options: { compatibility: true }
}
```

### Feature Portal-Spécifique (Custom)

```js
import { wrapWithPortalFeatureGate } from './apiRouteConfig.js';

'my-feature': {
  router: wrapWithPortalFeatureGate(myFeatureRoutes, 'my_feature'),
  options: { compatibility: true }
}
```

### Feature avec Sous-Routes Imbriquées

```js
// Si la feature a des routes enfants (ex: /:id/notes)
// Le router parent gère déjà /:id/notes dans ses routes
'credit-notes': {
  router: creditNotesRoutes,
  options: { compatibility: true }
}
```

## 12b. Permissions Registry

Les permissions sont générées dynamiquement depuis `portalConfig`. Pas besoin de modifier `permissions-registry.js` directement.

### Vérifier les Permissions Existantes

```js
// server/config/permissions-registry.js
import { getPermissions } from '../config/permissions-registry.js';

const features = getPermissions(portalConfig);
// → [{ id: 'credit_notes', label: '...', permissions: { view, edit, manage } }]
```

### Ajouter les Permissions dans le Portal Config

```json
// portal-configs/[portal].json
{
  "features": {
    "credit_notes": {
      "enabled": true,
      "label": "Notes de crédit",
      "icon": "receipt"
    }
  }
}
```

## 12c. Portal Feature Dependencies (Custom Only)

```js
// server/config/portal-feature-dependencies.js
export const PORTAL_TYPE_FEATURE_DEPENDENCIES = {
  // ... existing
  credit_notes: ['lrgmedia', 'comuse', 'demo'],  // portails autorisés
};
```

## 12d. Feature Gate (Custom Only)

```js
// server/routes/apiRouteConfig.js
import { wrapWithPortalFeatureGate } from './apiRouteConfig.js';

// Wraps la route avec un gate qui vérifie si la feature est activée pour le portail
'my-custom-feature': {
  router: wrapWithPortalFeatureGate(myCustomRoutes, 'my_custom_feature'),
  options: { compatibility: true }
}
```

## Checklist Enregistrement

- [ ] Route importée dans `apiRouteConfig.js`
- [ ] Clé ajoutée dans `API_ROUTES_CONFIG`
- [ ] Portal config JSON mis à jour (si feature activable)
- [ ] `portal-feature-dependencies.js` mis à jour (si custom)
- [ ] `wrapWithPortalFeatureGate` utilisé (si feature portal-spécifique)
- [ ] Permissions `view`, `edit`, `manage` disponibles pour le roleType
