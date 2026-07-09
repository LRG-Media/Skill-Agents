---
name: frontend-feature-structure
description: 'Standardiser la structure interne des features frontend React (pages, hooks, services, composants, config) dans client/src/features. À utiliser uniquement pour les features client, leurs routes/pages et leur structure locale.'
argument-hint: 'Donne la feature cible, son état actuel, et si tu veux un audit seul ou un plan de refactorisation.'
user-invocable: true
---

# Frontend Feature Structure

## Objectif

Garantir une structure cohérente, lisible et maintenable pour toute feature frontend sous c:\Projects\ClientPortalLRG\client\src\features\[domain]\[feature].

Principe lean obligatoire:
- si une catégorie (pages, hooks, services, components, config) contient 0 ou 1 fichier, ce fichier reste à la racine de la feature
- créer un sous-dossier seulement à partir de 2 fichiers pour la même catégorie
- éviter de créer une arborescence artificielle juste pour ressembler à un template
- privilégier les patterns déjà présents dans la feature locale avant de normaliser
- garder la logique métier hors des composants UI
- garder les services API purs: transport, mapping de réponse, gestion d’erreur
- utiliser les composants partagés plutôt que dupliquer des UI patterns
- si la feature touche une route/page client, appliquer aussi route-permission-sync

## Quand Utiliser

Utiliser ce skill quand la demande implique uniquement le client:
- création d’une nouvelle feature frontend
- refactorisation d’une feature existante
- audit d’une feature React trop plate ou trop éclatée
- décision sur le découpage pages/hooks/services/components
- vérification de cohérence entre page, route, permissions et navigation
- standardisation d’un flux UI déjà existant

Compléments obligatoires selon le scope:
- si la feature expose une nouvelle page/route client, appliquer aussi route-permission-sync
- si la feature fait partie d’un rollout multi-portail côté UI, appliquer d’abord portal-feature-architect puis ce skill

## Workflow Ajout Feature

Ordre recommandé:
1. définir le contrat d’architecture et de rollout si nécessaire côté UI (portal-feature-architect)
2. analyser la structure locale existante de la feature
3. décider si la feature reste plate ou devient découpée
4. organiser pages, hooks, services, composants et config selon la complexité réelle
5. synchroniser route, permissions et navigation si une page est ajoutée ou modifiée (route-permission-sync)
6. valider le build et les chemins importés

## Template Standard

Structure cible indicative:

client/src/features/[domain]/[feature]/
- index.js
- README.md ou README.md local si la feature a besoin d’expliquer son flux
- pages/
  - FeaturePage.jsx
- hooks/
  - useFeatureState.js
- services/
  - featureApi.js
- components/
  - FeatureForm.jsx
  - FeatureTable.jsx
- config/
  - featureConfig.js
- utils/ ou helpers/ seulement si le besoin est réel

Règle de bascule dossier:
- 0-1 fichier d’un type: rester à la racine
- 2+ fichiers du même type: créer le sous-dossier correspondant avec un index.js si le dossier expose plusieurs exports
- si la feature est simple, garder une structure plate

Règle de découpage:
- pages: composants de page, composition de haut niveau, orchestration de layout
- hooks: état local, pagination, filtres, chargement, orchestration
- services: appels API et mapping transport/réponse seulement
- components: UI réutilisable et présentiel
- config: métadonnées, colonnes, filtres, options, constantes de présentation
- utils/helpers: éviter par défaut, créer seulement si réutilisation réelle ou complexité justifiée

## Conventions De Nommage

- dossiers: kebab-case
- fichiers métier: feature.type.js ou FeatureType.jsx selon le contexte
- pages: FeaturePage.jsx, SettingsHome.jsx, SiteHealthDashboard.jsx
- hooks: useFeatureName.js
- services API: featureApi.js
- composants: PascalCase.jsx
- pas d’alias redondants dans les exports
- pas de logique métier dans les composants
- pas de calcul métier dans les services API
- utiliser les composants partagés quand ils existent déjà

## Règles D’Integration

- index.js de feature exporte les points d’entrée publics
- si un sous-dossier existe, il doit avoir son index.js seulement s’il expose plusieurs exports
- éviter les imports circulaires via index.js
- réutiliser les composants et hooks partagés avant d’en créer de nouveaux
- garder les services API séparés de l’UI
- ne pas déplacer la logique métier vers les pages pour simplifier artificiellement le code
- si une page change, vérifier route/permission/navigation avec route-permission-sync
- si la feature dépend d’un portail côté UI, vérifier le contexte portail avant de refactorer
- ne pas créer de route/page orpheline sans entrypoint, permission et navigation cohérents

## Règles De Structure

- feature plate si:
  - une seule page
  - peu d’état local
  - peu d’appels API
  - pas de sous-vues métier significatives

- feature découpée si:
  - plusieurs pages ou sous-vues
  - plusieurs hooks métier
  - plusieurs services API
  - plusieurs composants réutilisables
  - logique de filtrage/pagination/crud importante

- éviter de créer components, hooks, services, config si un seul fichier suffit
- ne pas créer de couche intermédiaire sans bénéfice clair
- privilégier la lisibilité à la symétrie de dossiers

## Règles Routes Et Legacy

- préférer des routes/pages explicites aux liens dynamiques ou aux imports catch-all implicites
- toute page, route, hook ou service non utilisé côté portail/client doit être candidate à suppression complète
- suppression complète = page + composants associés + hook + service API + config + exports + tests + README si présent
- ne pas garder un hook, un service API ou un composant non branché "au cas où"
- toute suppression d’élément UI doit vérifier les usages cross-feature frontend avant suppression

## Guide D’Audit

1. Lister les dossiers/fichiers existants pour la feature.
2. Vérifier si la feature est plate ou si elle justifie un découpage.
3. Comparer la structure réelle aux patterns déjà utilisés dans le repo.
4. Relever les écarts de nommage et d’organisation.
5. Vérifier que les pages restent fines et que la logique est dans les hooks/services.
6. Vérifier qu’aucune logique métier n’a glissé dans l’UI.
7. Vérifier qu’aucun service API ne fait autre chose que du transport/mapping.
8. Vérifier la cohérence route/permission/navigation si la feature expose une page.
9. Vérifier la réutilisation des composants partagés.
10. Identifier les doublons inutiles et les fichiers trop fragmentés.
11. Produire un plan atomique de refactorisation si nécessaire.
12. Construire une matrice Page -> usage UI -> usage cross-feature frontend.

## Workflow De Suppression Legacy (Obligatoire)

1. Produire la matrice d’usage des pages, composants, hooks et services.
2. Marquer chaque élément: keep | remove | verify.
3. Supprimer la page ou la route candidate.
4. Supprimer les composants associés devenus orphelins.
5. Supprimer le hook et la logique d’orchestration associés.
6. Supprimer le service API et ses imports associés si non branchés.
7. Supprimer la config, les constantes ou les métadonnées non branchées.
8. Nettoyer les exports index.js et les consumers.
9. Mettre à jour le README local et les tests si la feature en possède.
10. Valider avec build et vérification des usages restants.

## Checklist De Validation

- feature plate ou découpée selon complexité réelle
- pages fines et centrées sur la composition
- hooks pour l’état et l’orchestration
- services API purs
- composants présentiels quand possible
- pas de logique métier dans l’UI
- pas de duplication de composants partagés
- pas de sous-dossiers inutiles
- conventions de nommage respectées
- index.js uniquement quand il y a plusieurs exports à exposer
- route/permission/navigation vérifiés si une page a changé
- build client valide après changement majeur
- lint client valide après changement majeur
- aucune page ou route orpheline
- aucun hook ou service API legacy non utilisé
- aucun composant partagé dupliqué sans raison
- suppression d’élément legacy accompagnée d’une vérification des usages

## Validation Finale Obligatoire

Pour toute modif structurelle/legacy:
- exécution du build client après les changements
- exécution du lint client après les changements
- vérification des routes/permissions/navigation si une page a changé
- vérification des imports et exports sur les fichiers modifiés
- si échec: corriger avant clôture
- alignement confirmé avec route-permission-sync et portal-feature-architect côté UI si concernés

## Sortie Attendue

Pour chaque audit:
1. État: Compliant | Refactor Needed | Non-Compliant
2. Écarts: liste concrète par fichier
3. Plan: étapes de refactorisation ordonnées
4. Validation: checklist PASS/FAIL
5. Alignement cross-skill: route-permission-sync PASS/FAIL/N/A, portal-feature-architect PASS/FAIL/N/A

## Priorité De Lecture

1. client/src/features/settings
2. client/src/features/site-health
3. client/src/features/crm
4. client/src/features/communication
5. client/src/shared