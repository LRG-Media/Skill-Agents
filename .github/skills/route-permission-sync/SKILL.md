---
name: route-permission-sync
description: 'Synchroniser toute nouvelle route React avec routesAccessConfig, AutoProtectedRoute, permissions et navigation Sidebar/Settings. Utiliser ce skill quand on ajoute, modifie ou déplace une page afin d éviter les routes invisibles, non protégées ou incohérentes.'
argument-hint: 'Décris la route cible, la page à créer/modifier, sa visibilité UI et les permissions attendues.'
user-invocable: true
---

# Route Permission Sync

## Objectif

Éviter les régressions d accès quand une route est ajoutée ou modifiée.

Ce skill garantit l alignement entre :
- la page React
- la configuration centralisée dans client/src/shared/config/routesAccessConfig.js
- la protection via AutoProtectedRoute
- la navigation (Sidebar, module cards, Settings)
- les permissions attendues côté frontend et backend

## Pertinence Pour PortalWebApp

Ce skill est très pertinent pour ce repo, car le routing est en grande partie généré depuis routesAccessConfig.

Le projet contient déjà des points critiques qui justifient ce skill :
- génération des routes dans client/src/app/main.jsx (generateMainRoutes, generateOtherRoutes)
- mapping automatique des permissions via generateRoutePermissionsMap
- protection dynamique via AutoProtectedRoute
- affichage navigation dépendant de routesAccessConfig + feature + permission + roleType

## Quand Utiliser

Utiliser ce skill quand la demande implique :
- une nouvelle page avec une URL
- une route de détail (exemple : /projects/:id/files)
- un changement de permission sur une route existante
- un changement de visibilité dans Sidebar, module cards, ou Settings
- une route visible seulement par URL (sans menu)

Compléments obligatoires selon le scope :
- pour une demande de feature complète (front + back + permissions + rollout portail), appliquer d'abord portal-feature-architect puis ce skill
- si la route dépend d'un nouveau module backend, appliquer aussi backend-feature-structure pour garantir l'alignement des guards côté API

## Procédure

Ordre de travail recommandé :
1. cadrer le contrat de feature (portal-feature-architect)
2. synchroniser la route et la navigation (ce skill)
3. implémenter la page et les guards associés
4. valider frontend + backend de bout en bout

### 1. Qualifier Le Type De Route

Répondre d abord :
1. Est-ce une route main, other, settings, ou une route spécifique hors génération ?
2. La page doit-elle apparaître dans la navigation ?
3. La page est-elle feature-gated ?
4. La page nécessite-t-elle un roleType précis ?

### 2. Créer Ou Mettre À Jour La Page React

1. Créer la page au bon emplacement feature-based : client/src/features/[domain]/[feature]/...
2. Vérifier la correspondance component map dans client/src/app/main.jsx si la route est générée.
3. Si la route est paramétrée (ex: :id), vérifier la cohérence avec les liens existants.

### 3. Synchroniser routesAccessConfig

Mettre à jour client/src/shared/config/routesAccessConfig.js :
1. Ajouter l entrée dans la bonne section (main, other, settings).
2. Si section main ou other générée :
- ajouter la clé de route
- inclure la clé dans _routeKeys
3. Définir path, permission, roleType, feature selon le besoin réel.
4. Si la route doit être visible dans la navigation :
- mettre à jour navItems et/ou moduleCards selon le pattern existant.

Règle stricte :
Ne jamais ajouter une route sans vérifier routesAccessConfig.js.

### 4. Vérifier La Protection AutoProtectedRoute

1. Vérifier que la route passe bien par AutoProtectedRoute (généré ou explicite).
2. Contrôler requiredPermission(s) et requiredRoleType si route explicite.
3. Vérifier que le comportement sans permission mène vers accès refusé et non vers un rendu partiel incohérent.

### 5. Valider La Cohérence Permissions

1. La permission frontend utilisée doit exister dans la stratégie de permissions active.
2. Si nouvelle permission : aligner la nomenclature avec le module.
3. Vérifier la cohérence avec les guards backend associés aux endpoints de la page.

### 6. Vérifier La Visibilité Navigation

1. Sidebar : visible seulement si feature + permission + roleType valides.
2. Settings : carte et item visibles selon routesAccessConfig.settings.
3. Si route URL-only : ne pas exposer dans navItems/moduleCards.

### 7. Validation Finale

Checklist :
- route ajoutée dans la bonne section de routesAccessConfig
- _routeKeys mis à jour si route générée
- page câblée dans main.jsx si requis
- AutoProtectedRoute appliqué correctement
- permission et roleType cohérents
- visibilité Sidebar/Settings conforme au besoin
- endpoint backend correspondant protégé
- cohérence avec le contrat d'architecture (portal-feature-architect)

## Contrat De Sortie Obligatoire

Pour chaque demande de route, retourner :

### 1) Route Contract
- route_path:
- route_category: main | other | settings | explicit
- generated_route: yes | no
- visibility: sidebar | module-card | settings | url-only

### 2) Frontend Sync
- page_files_to_create:
- page_files_to_update:
- routes_access_config_updates:
- main_js_updates:
- auto_protected_route_updates:

### 3) Permission Sync
- permission_required:
- role_type_required:
- feature_required:
- backend_guard_alignment:

### 4) Validation
- route_registered: PASS | FAIL
- auto_protected: PASS | FAIL
- navigation_visibility_ok: PASS | FAIL | N/A
- permission_alignment_ok: PASS | FAIL
- backend_protection_ok: PASS | FAIL

### 5) Risks
- risk_1:
- risk_2:
- mitigation:

## Conditions D Échec

Une implémentation route est incomplète si :
1. La page existe mais aucune entrée n est ajoutée/synchronisée dans routesAccessConfig.
2. La route est accessible sans protection permission attendue.
3. La route est en menu alors qu elle devait être URL-only.
4. La route est en _routeKeys mais pas mappée correctement dans main.jsx.
5. Les permissions frontend ne correspondent pas à la protection backend.
6. La route est livrée sans alignement explicite avec le contrat défini dans portal-feature-architect.

## Exemple Guidé

Demande : Créer la page /projects/:id/files

Sortie attendue minimale :
- création de la page React dans la feature project-management
- synchronisation dans routesAccessConfig (catégorie + permission + feature)
- vérification du flux de génération dans main.jsx
- vérification AutoProtectedRoute
- décision explicite sur visibilité Sidebar (oui/non)
- vérification de la cohérence backend endpoint/permission
