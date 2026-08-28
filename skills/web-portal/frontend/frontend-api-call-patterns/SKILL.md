---
name: frontend-api-call-patterns
description: "Tracer les appels API frontend ↔ backend pour une feature. Identifier les patterns d'appels (hooks, services, fetch directs, SearchField, DetailPageTabs), les routes backend non utilisées, et produire un tableau bidirectionnel frontend ↔ backend. Utile pour audit, nettoyage de code mort, ou vérification d'alignement."
applyTo: "**"
---

# Frontend API Call Patterns — Tracé Bidirectionnel

## Objectif

Identifier **tous les appels** entre le frontend React et le backend Node.js/Express pour une feature donnée. Utile pour :
- Vérifier qu'une route backend est bien utilisée
- Trouver le code mort (routes non appelées)
- Auditer l'alignement frontend ↔ backend
- Préparer une refactorisation de routes

---

## Architecture des appels

```
Frontend (React)                    Backend (Express)
─────────────────                   ──────────────────
Feature hook/component
  ↓
UnifiedXxxService (BaseApiService)
  ↓
apiService (axios/fetch)
  ↓
HTTP request → /api/...
                                    Router → Controller → Service → Prisma
```

---

## Patterns d'appel identifiés

### Pattern 1 : Service API (BaseApiService)
```
client/src/features/{feature}/{feature}Api.js
  → class UnifiedXxxService extends BaseApiService {
      super('/endpoint')
    }
```
Méthodes héritées : `getAll()`, `getById()`, `create()`, `update()`, `delete()`

### Pattern 2 : Hook React
```
client/src/features/{feature}/hooks/*.js
  → import { service } from '../{feature}Api.js'
  → service.getAll(filters)    → GET /endpoint
  → service.create(data)       → POST /endpoint
  → service.update(id, data)   → PUT /endpoint/:id
  → service.delete(id)         → DELETE /endpoint/:id
```

### Pattern 3 : Composant React
```
client/src/features/{feature}/**/*.jsx
  → import { service } from '../{feature}Api.js'
  → service.getById(id)        → GET /endpoint/:id
  → service.update(id, data)   → PUT /endpoint/:id
```

### Pattern 4 : Fetch direct (non standard)
```js
fetch(`/api/{feature}/${id}`, { method, headers, body })
```
⚠️ Pattern à éviter — pas de gestion d'erreur standardisée.

### Pattern 5 : SearchField (recherche globale)
```
client/src/shared/components/molecules/fields/searchfields/
  → SearchField feature="{feature}"
  → appelle searchService.js → service.getAll(filters)
```

### Pattern 6 : DetailPageTabs / RelatedTabs
```
client/src/shared/related/
  → BaseRelatedTab → service.getNotes(id), service.getHistory(id)
```

### Pattern 7 : GenericFeaturePage + config
```
client/src/features/{feature}/config.jsx
  → useFilters: useAppointments
  → onDelete: service.delete(id)
```

---

## Méthode de recherche — 7 étapes

### Étape 1 : Identifier le service API de la feature

```bash
file_search: "client/src/features/{feature}/**Api.js"
grep_search: "client/src/features/{feature}/**", "extends BaseApiService"
```

Dans le fichier API, chercher `super('/endpoint')` pour la base URL.

### Étape 2 : Scanner les hooks
```bash
grep_search: "client/src/features/{feature}/hooks/**", "\.(getAll|getById|create|update|delete|cancel)\("
```

### Étape 3 : Scanner les composants
```bash
grep_search: "client/src/features/{feature}/**/*.jsx", "fetch\(|Api\.|Service\."
```

### Étape 4 : Scanner les refs shared
```bash
grep_search: "client/src/shared/**", "{serviceName}\."
grep_search: "client/src/shared/**", "feature=\"{feature}\""
grep_search: "client/src/shared/**", "AppointmentsTab|{Feature}Tab"
```

### Étape 5 : Chercher les appels HTTP directs (fetch/axios)
```bash
grep_search: "client/src/**", "/api/{feature}"
grep_search: "client/src/**", "fetch.*{feature}"
grep_search: "client/src/**", "axios.*{feature}"
```

### Étape 6 : Chercher les routes dans le backend
```bash
grep_search: "server/features/{feature}/**/routes/*.js", "router\.(get|post|put|delete)"
```

### Étape 7 : Lire la config des routes
```bash
read_file: "server/routes/apiRouteConfig.js"  # Vérifier l'enregistrement
read_file: "server/features/{feature}/routes/*.js"  # Lister les endpoints
```

---

## Tableau de sortie — Routes Backend vs Frontend

Pour chaque feature, produire un tableau :

```markdown
## Routes Backend vs Frontend — {Feature}

### Backend Routes (de routes/*.js)
| # | Méthode | Endpoint | Purpose |
|---|---------|----------|---------|
| 1 | GET | /appointments | Liste |
| 2 | POST | /appointments | Création |
| ... | ... | ... | ... |

### Frontend Calls (trouvés)
| Méthode | Endpoint | Fichier | Ligne | Via |
|---------|----------|---------|-------|-----|
| GET | /appointments | useAppointments.js | 167 | Service API |
| POST | /appointments | useAppointments.js | 249 | Service API |
| GET | /api/appointments/:id | ModalBooking.jsx | 80 | fetch direct |
| ... | ... | ... | ... | ... |

### Routes Backend NON utilisées
| Méthode | Endpoint | Raison |
|---------|----------|--------|
| GET | /appointments/available-slots | Généré côté client |
| POST | /appointments/contacts | Aucun appel trouvé |
| ... | ... | ... |
```

---

## Questionnaire d'analyse

Pour chaque feature, répondre à ces questions :

1. **Service API** : Quel fichier ? Quel base URL ? Méthodes custom ?
2. **Hooks** : Quels hooks appellent le service ? Quelles méthodes ?
3. **Composants** : Quels composants appellent le service ou fetch() ?
4. **Shared** : SearchField, DetailPageTabs, featureConfigs l'utilisent ?
5. **Fetch directs** : Y a-t-il des `fetch()` ou `axios()` hors service ?
6. **Routes non utilisées** : Quelles routes backend ne sont pas appelées ?
7. **Doublons** : Le même endpoint est-il appelé depuis plusieurs endroits ?

---

## Pièges courants

| Piège | Exemple | Solution |
|-------|---------|----------|
| Imports ré-exports | `index.js` ré-exporte le service | Chercher aussi dans `index.js` |
| Services globaux | `SearchField` utilise `contactsApi` global | Vérifier `searchService.js` |
| BaseApiService | `getAll()` hérité, pas dans le fichier API | Lire la classe parente |
| fetch() direct | `ModalBooking.jsx` utilise `fetch()` | Signaler comme non standard |
| Appels indirects | `DetailPageTabs` appelle via `BaseRelatedTab` | Vérifier `featureConfigs.js` |
| Routes non déclarées | Routes dans `routes/groups/` | Vérifier `server/routes/` aussi |

---

## Fichiers clés à toujours vérifier

```
Backend :
  server/features/{feature}/routes/*.js          ← Routes API
  server/routes/apiRouteConfig.js                ← Configuration des routes
  server/routes/groups/*.js                      ← Groupes de routes

Frontend :
  client/src/features/{feature}/{feature}Api.js  ← Service API (BaseApiService)
  client/src/features/{feature}/hooks/*.js       ← Hooks React
  client/src/features/{feature}/config.jsx       ← Configuration feature
  client/src/shared/related/featureConfigs.js    ← Config relations
  client/src/shared/services/searchService.js    ← Service de recherche globale
  client/src/shared/components/organisms/        ← Composants shared
```

---

## Exemples par feature

### Appointments
```bash
grep_search: "client/src/**", "unifiedAppointmentService\."
grep_search: "client/src/**", "appointmentsApi\."
grep_search: "client/src/**", "useAppointments"
grep_search: "client/src/**", "fetch.*appointment"
grep_search: "client/src/**", "/api/appointments"
grep_search: "client/src/**", "feature=\"appointment\""
read_file: "server/features/project-management/appointments/routes/appointmentsRoutes.js"
```

### Invoices
```bash
grep_search: "client/src/**", "unifiedInvoiceService\."
grep_search: "client/src/**", "invoicesApi\."
grep_search: "client/src/**", "fetch.*invoice"
grep_search: "client/src/**", "/api/invoices"
grep_search: "client/src/**", "feature=\"invoice\""
read_file: "server/features/finance/invoices/routes/invoiceRoutes.js"
```

### Contacts
```bash
grep_search: "client/src/**", "contactsApi\."
grep_search: "client/src/**", "useContacts"
grep_search: "client/src/**", "fetch.*contact"
grep_search: "client/src/**", "/api/contacts"
grep_search: "client/src/**", "feature=\"contact\""
read_file: "server/features/crm/contacts/routes/contactsRoutes.js"
```

### Projects
```bash
grep_search: "client/src/**", "projectsApi\."
grep_search: "client/src/**", "useProjects"
grep_search: "client/src/**", "fetch.*project"
grep_search: "client/src/**", "/api/projects"
grep_search: "client/src/**", "feature=\"project\""
read_file: "server/features/project-management/projects/routes/projectsRoutes.js"
```
