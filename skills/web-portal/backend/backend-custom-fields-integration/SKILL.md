---
name: backend-custom-fields-integration
description: 'Intégrer les custom fields (ModuleFieldsService) dans un service backend. Lecture batch/single, écriture, suppression, validation, et standardisation des réponses API.'
argument-hint: 'Nom de la feature et entityType à intégrer (ex: contacts, leads, projects).'
user-invocable: true
---

# Custom Fields Integration

## Objectif

Intégrer les custom fields dans un service backend existant en suivant le pattern standard du projet.

## Quand Utiliser

- Créer une nouvelle feature qui nécessite des custom fields
- Auditer une feature existante pour vérifier l'intégration custom fields
- Migration d'un service vers le pattern standard
- Vérifier que les réponses PUT/POST incluent `custom_fields`

## Prérequis

Le service `ModuleFieldsService` doit exister dans `server/features/system/settings/services/ModuleFieldsService.js`.

## Méthodes disponibles

| Méthode | Signature | Usage |
|---------|-----------|-------|
| `getCustomFields` | `(entityType, entityId[])` | Lecture — number → objet, array → Map |
| `updateCustomFields` | `({ entityType, entityId, values, userId, moduleName, validate })` | Écriture — filtre auto + validation optionnelle |
| `deleteCustomFields` | `(entityType, entityIds[])` | Suppression — bulk en 1 transaction |

## Pattern d'intégration (5 étapes)

### Étape 1 — Import

```js
import { ModuleFieldsService } from '../../../system/settings/services/ModuleFieldsService.js';
```

### Étape 2 — Liste (batch)

```js
// Après le prisma.findMany
const ids = items.map(i => i.id).filter(Boolean);
if (ids.length > 0) {
  const customMap = await ModuleFieldsService.getCustomFields(entityType, ids);
  for (const item of items) {
    item.custom_fields = customMap.get(item.id) || {};
  }
}
```

### Étape 3 — Détail (single)

```js
// Après le prisma.findUnique
const custom = await ModuleFieldsService.getCustomFields(entityType, id);
item.custom_fields = custom || {};
```

### Étape 4 — Create/Update

```js
// Après le prisma.create ou prisma.update
await ModuleFieldsService.updateCustomFields({
  entityType,
  entityId: entity.id,
  values: payload,        // payload complet ou custom_fields uniquement
  userId: actorId,
  moduleName: 'entities'  // pour auto-filtrage
});
```

### Étape 5 — Delete

```js
// Avant ou après le prisma.delete
await ModuleFieldsService.deleteCustomFields(entityType, [entity.id]);
```

## Règles API

1. **Réponse `custom_fields`** : toujours sous la clé `custom_fields`, jamais merge à la racine via `Object.assign`
2. **PUT = GET** : le retour du update doit passer par `getXxxById()` pour la même structure que le GET
3. **Nomenclature** : toujours `get{Entity}ById`, jamais `getById`
4. **Validation** : utiliser `validate: true` dans `updateCustomFields` quand le payload contient des champs DB + custom mélangés

## Checklist audit

- [ ] Import `ModuleFieldsService` présent
- [ ] `getCustomFields` appelé en batch dans la méthode liste
- [ ] `getCustomFields` appelé en single dans la méthode détail
- [ ] `updateCustomFields` appelé dans create et update
- [ ] `deleteCustomFields` appelé dans delete
- [ ] Réponse GET contient `custom_fields`
- [ ] Réponse PUT contient `custom_fields`
- [ ] Réponse PUT passe par `getXxxById()`
- [ ] Nomenclature `get{Entity}ById` (pas `getById`)

## Features déjà intégrées

| Feature | entityType | Statut |
|---------|:---:|:---:|
| `crm/accounts` | `account` | ✅ |
| `crm/contacts` | `contact` | ✅ |
| `crm/leads` | `lead` | ✅ |
| `pm/projects` | `project` | ✅ |
| `pm/tasks` | `task` | ✅ |
| `pm/time-tracking` | — | ⚠️ Pas de custom fields |
| `custom/comuse/inspections` | `inspection` | ✅ |

## Features à intégrer (priorité)

| Feature | entityType | Priorité |
|---------|:---:|:---:|
| `finance/invoices` | `invoice` | 🟡 Moyenne |
| `finance/quotes` | `quote` | 🟡 Moyenne |
| `pm/appointments` | `appointment` | 🟡 Moyenne |
| `communication/notes` | `note` | ❌ Faible |
| `system/tags` | `tag` | ❌ Faible |
