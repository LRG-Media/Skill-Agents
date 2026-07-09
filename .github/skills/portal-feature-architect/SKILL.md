---
name: portal-feature-architect
description: 'Concevoir et implémenter des fonctionnalités PortalWebApp en respectant l architecture multi-portail, les feature flags, les routes, les permissions, le roleType, la structure frontend par feature et la protection backend. À utiliser pour toute demande de nouvelle feature ou de modification structurante.'
argument-hint: 'Décris la fonctionnalité demandée, les portails cibles et le comportement UI/API attendu.'
user-invocable: true
---

# Portal Feature Architect

## Objectif

Garantir qu'une fonctionnalité est intégrée correctement dans PortalWebApp sur :
- la disponibilité multi-portail
- les feature flags
- les routes et points d'entrée UI
- les permissions et roleType
- l'architecture frontend orientée feature
- la protection et l'autorisation backend

Ce skill est aligné sur les patterns réels du projet :
- vérification frontend via isFeatureEnabled(...) dans client/src/shared/config/portalConfig.js
- accès route/navigation via client/src/shared/config/routesAccessConfig.js
- protection backend via authenticateToken + middleware de permissions (requirePermission(...) ou wrappers de module)
- vérification des features portail backend via requireFeature(...) dans server/config/portalConfig.js

## Quand Utiliser

Utiliser ce skill quand la demande inclut au moins un des cas suivants :
- ajouter ou modifier une feature frontend
- ajouter ou modifier des endpoints backend
- ajouter des permissions ou des accès de rôle
- exposer une feature différemment selon les portails (lrgmedia, comuse, demo)
- relier une action UI à une API protégée
- auditer si une feature est bien intégrée à l'architecture

Compléments obligatoires selon le scope :
- si la feature ajoute une page/route frontend, appliquer aussi le skill route-permission-sync
- si la feature ajoute un module backend dans server/features, appliquer aussi le skill backend-feature-structure

## Entrées Requises

Avant implémentation, collecter :
1. nom de la feature et objectif métier
2. feature commune ou spécifique portail
3. rollout portail (lrgmedia, comuse, demo)
4. point d'entrée UI attendu (sidebar, dashboard, settings, action seule, URL seule)
5. capacité API requise
6. permission et roleType requis

## Procédure

### 1. Classifier La Feature

Répondre d'abord :
1. Feature commune ou portail-spécifique ?
2. Page visible utilisateur ou action interne ?
3. Nouvelle API nécessaire ou API existante réutilisable ?
4. Permission existante réutilisable ou nouvelle permission requise ?

Si la feature est portail-spécifique, définir explicitement la disponibilité dans :
- portal-configs/lrgmedia.json
- portal-configs/comuse.json
- portal-configs/demo.json

### 2. Définir Le Contrat De Feature Flag

1. Choisir un nom de flag unique et garder un nommage cohérent frontend/backend.
2. Ajouter la disponibilité par portail dans les configs portail.
3. Documenter le comportement par défaut quand le flag est false.

Règles :
- ne pas hardcoder des checks de portail dans les composants
- préférer un gating piloté par config via isFeatureEnabled(...), clé feature de route, ou ConditionalRoute

Note de nommage :
- les portal configs contiennent déjà des styles mixtes (time-tracking, site-health, etc.)
- le backend fournit normalizeFeatureName(...)
- éviter d'introduire des alias doublons pour une même feature, sauf besoin de compatibilité

### 3. Planifier L'Architecture Frontend

Utiliser une structure par feature :
- client/src/features/[domain]/[feature]/

Déterminer les points d'intégration exacts :
1. route nécessaire ou action seule ?
2. visibilité navigation (sidebar/dashboard/settings) ou action cachée ?
3. déclaration d'accès route dans :
   - client/src/shared/config/routesAccessConfig.js

Lignes directrices :
- garder la logique métier hors des composants UI
- réutiliser les composants partagés existants quand c'est pertinent
- éviter les abstractions génériques trop tôt

Note d'intégration :
- la sidebar et les module cards filtrent déjà par feature, permission et roleType
- si la feature ajoute une entrée de route/module, la connecter dans routesAccessConfig pour bénéficier du filtrage automatique

### 3.5. Planifier La Structure Backend Interne

Avant de coder, définir l'arborescence backend cible en suivant backend-feature-structure :
1. structure lean (fichier à la racine si un seul élément, sous-dossier si plusieurs)
2. nommage standard (feature.controller.js, feature.service.js, feature.routes.js, models/PascalCaseSchema.js)
3. fichiers obligatoires à la racine de la feature :
  - index.js (exports publics)
  - Readme.md (objectif, endpoints, flux, dépendances)
  - test.[feature].routes.mjs (test exécutable one-shot)
4. aucun fichier permissions local (utiliser server/shared/middleware/permissions.js)
5. découper les gros fichiers pour éviter des blocs monolithiques

Rappel : le dossier models/ est obligatoire même avec un seul schéma.

### 4. Planifier Le Modèle De Permissions Et De Rôles

Pour chaque action, définir :
1. clé de permission (exemple : emails.ai.draft)
2. permission élevée optionnelle (exemple : emails.ai.admin)
3. roleType requis si applicable

Minimum attendu :
- la visibilité frontend respecte les checks de permissions
- le backend enforce les permissions de manière indépendante

### 5. Planifier La Protection Backend Et La Structure Module

Utiliser une structure backend par feature :
- server/features/[domain]/[feature]/

Chaque endpoint protégé doit enforce, dans cet ordre :
1. authentification (authenticateToken)
2. feature active pour le portail courant (requireFeature('flagName')) si feature-gated
3. check de permission (requirePermission('permission.key')) ou middleware de permission spécifique au module
4. contrainte roleType si nécessaire
5. validation du payload

Ne jamais se reposer uniquement sur la protection frontend.

Pattern projet à réutiliser en priorité :
- les modules feature exposent souvent des middlewares composés (exemple : inject + require dans communication/system)
- préférer étendre ce pattern local plutôt qu'inventer un nouveau style d'autorisation

Si la feature implique de l'IA, inclure des couches de sécurité :
- rédaction des données sensibles avant appel fournisseur IA (exemple : redactEmailPii)
- sanitization de la réponse IA avant retour client (exemple : sanitizeAiResponse)

### 6. Structurer Puis Implémenter

Ordre de travail recommandé :
1. créer d'abord la structure frontend/backend cible
2. créer les fichiers pivots (index.js, Readme.md, test.[feature].routes.mjs)
3. implémenter ensuite la logique métier et les routes
4. finir par la validation end-to-end

### 7. Valider

Checklist de validation :
1. portal config mise à jour pour chaque portail
2. gate feature flag présent en UI et/ou routes
3. routesAccessConfig mis à jour si nécessaire
4. permissions déclarées et référencées de façon cohérente
5. endpoint backend protégé avec auth + feature + permission (+ roleType)
6. validation d'entrée et gestion d'erreurs implémentées
7. aucune logique conditionnelle portail hardcodée en UI
8. test API exécuté avec token frais pour les routes protégées
9. logs serveur vérifiés après tests (server/logs/app.log)

Pour les changements API, tester avec un token frais depuis les credentials du portal config et inclure l'en-tête Authorization.

### 8. Produire Un Résumé D'Architecture À Chaque Réponse

Lors d'une proposition ou implémentation, toujours produire :
- nom du feature flag
- portails impactés et valeurs de rollout
- fichiers frontend à créer/modifier
- fichiers backend à créer/modifier
- routes et points d'entrée UI
- permissions et roleType
- statut de checklist de validation
- risques principaux et mitigations

## Contrat De Sortie Obligatoire

Pour chaque demande de feature, retourner cette structure :

### 1) Feature Contract
- feature_name:
- feature_flag:
- feature_scope: common | portal-specific
- portals:
  - lrgmedia:
  - comuse:
  - demo:

### 2) Frontend Integration
- route_required: yes | no
- ui_entry_points: sidebar | dashboard | settings | action-only | url-only
- files_to_create:
- files_to_update:
- routes_access_updates:
- feature_gating_strategy: isFeatureEnabled | route feature key | ConditionalRoute

### 3) Permission Contract
- permissions_new:
- permissions_reused:
- role_type_constraints:
- frontend_visibility_checks:

### 4) Backend Contract
- endpoints_new:
- endpoints_updated:
- middleware_chain_per_endpoint:
  - authenticateToken
  - requireFeature(...) si feature-gated
  - requirePermission(...) ou middleware spécifique module
  - middleware de validation
- service_safety_layers: pii_redaction | output_sanitization | none

### 5) Validation Checklist
- portal_configs_updated: PASS | FAIL
- routes_access_config_aligned: PASS | FAIL | N/A
- backend_protection_complete: PASS | FAIL
- permission_consistency_fe_be: PASS | FAIL
- api_test_with_fresh_token: PASS | FAIL
- app_log_reviewed: PASS | FAIL

### 5b) Backend Structure Checklist
- backend_folder_structure: PASS | FAIL
- index_js_exports_complete: PASS | FAIL
- readme_md_present_and_documented: PASS | FAIL
- test_routes_mjs_present_and_runnable: PASS | FAIL
- no_local_permissions_file: PASS | FAIL
- models_folder_present_with_schema: PASS | FAIL

### 6) Risks
- risk_1:
- risk_2:
- mitigation_plan:

## Matrice De Decision Rapide

1. Si aucune page dédiée n'est nécessaire :
- intégrer au niveau action (bouton, modal, hook)
- ne pas créer de route par défaut

2. Si la feature est portail-spécifique :
- configurer dans portal-configs
- ne jamais hardcoder le type de portail dans les composants

3. Si l'endpoint est protégé :
- middleware backend obligatoire même si le frontend check déjà les permissions

## Conditions D'Échec (Ne Pas Marquer Comme Terminé)

Une feature est incomplète si au moins un point est vrai :
1. Le frontend masque la feature, mais l'endpoint backend reste accessible sans garde correcte.
2. La disponibilité portail est gérée par des checks hardcodés dans l'UI.
3. Les noms de permissions divergent entre frontend et backend.
4. Une route est ajoutée sans alignement dans la configuration d'accès route quand requis.
5. L'API protégée n'a pas été testée avec un token frais.
6. La structure backend ne respecte pas le template attendu (arborescence, nommage, exports).
7. Le module backend n'inclut pas Readme.md et test.[feature].routes.mjs.
8. Un middleware de permissions local est créé au lieu de réutiliser le middleware partagé.

## Cas D'Usage Concret: Assistant IA Email

Demande : "Ajouter un assistant IA pour répondre aux emails"

Sortie d'architecture attendue :
- feature flag: emailAiDrafts
- rollout portail :
  - lrgmedia: true
  - comuse: false
  - demo: true

- frontend :
  - client/src/features/communication/email-ai/
  - client/src/features/communication/email/components/AiDraftButton.jsx
  - client/src/features/communication/email/hooks/useEmailAiDraft.js
- modèle de route : intégration niveau action (bouton), pas de page complète sauf besoin produit explicite
- permissions :
  - emails.ai.draft
  - emails.ai.summarize
  - emails.ai.admin
- backend :
  - server/features/communication/email-ai/
  - enforce requireFeature('emailAiDrafts')
  - enforce permission middleware (par exemple requirePermission('emails.ai.draft') ou équivalent de module)
  - appliquer redactEmailPii avant appel IA
  - appliquer sanitizeAiResponse après appel IA

Note d'adaptation pour ce repo :
- le module email existant vit dans client/src/features/communication/email/ et server/features/communication/emails/
- les routes email backend existantes suivent déjà un pattern de middleware composé (injectEmailPermissions + requireEmailPermissions)
- si l'IA de rédaction est ajoutée dans le flow email existant, préférer étendre ces modules avant de créer une arborescence parallèle

## Critères De Completion

Une feature est complète uniquement si :
1. le placement architectural est correct (frontend et backend)
2. le rollout portail est piloté par config
3. l'exposition route/UI est intentionnelle et documentée
4. le modèle de permissions est explicite et enforce côté backend
5. le comportement API protégé est validé avec des tests token frais
6. les logs et cas limites sont vérifiés

