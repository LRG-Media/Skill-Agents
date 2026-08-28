---
name: backend-feature-structure
description: 'Standardiser la structure interne des features backend (dossiers, fichiers, exports, nomenclature) dans server/features. A utiliser pour creation, refactorisation ou audit de feature backend.'
argument-hint: 'Donne le domaine/feature cible, son etat actuel, et si tu veux un audit seul ou un plan de refactorisation.'
user-invocable: true
---

# Backend Feature Structure

## Objectif

Garantir une structure coherente et maintenable pour toute feature backend sous server/features/[domain]/[feature].

Principe lean obligatoire:
- si une categorie (controllers, services, routes, utils) contient 0 ou 1 fichier, ce fichier reste a la racine de la feature
- creer un sous-dossier seulement a partir de 2 fichiers pour la meme categorie
- exception obligatoire: models doit toujours etre un dossier, meme avec un seul fichier
- ne jamais creer de dossier permissions: tout passe par le middleware central server/shared/middleware/permissions.js
- limiter l usage de helpers/constants/formatters: ne les creer que si la reutilisation est reelle
- viser des fichiers < 500 lignes, sinon decouper
- creer un README.md a la racine de la feature pour expliquer son fonctionnement
- creer un fichier de test de feature a la racine: test.[feature].routes.mjs (obligatoire)

## Quand Utiliser

Utiliser ce skill quand la demande implique:
- creation d une nouvelle feature backend
- refactorisation d une feature existante
- harmonisation de nomenclature dossiers/fichiers
- verification des exports index.js
- audit de coherence structurelle par domaine

Complements obligatoires selon le scope:
- pour une feature complete (rollout portail + UI + permissions + API), appliquer d abord portal-feature-architect puis ce skill
- si la feature expose une nouvelle page/route frontend, appliquer aussi route-permission-sync

## Workflow Ajout Feature (Aligne)

Ordre recommande:
1. definir le contrat d architecture et de rollout (portal-feature-architect)
2. preparer la structure backend cible (ce skill)
3. implementer controllers/services/routes/validation
4. synchroniser la route frontend et les permissions UI si necessaire (route-permission-sync)
5. valider end-to-end (tests feature + app.log)

## Template Standard

Structure cible:

features/[domain]/[feature]/
- index.js
- README.md
- test.[feature].routes.mjs (obligatoire, test des endpoints actifs de la feature)
- feature.controller.js (ou controllers/ si 2+ fichiers)
- feature.service.js (ou services/ si 2+ fichiers)
- feature.routes.js (ou routes/ si 2+ fichiers)
- models/ (obligatoire)
	- ContactsSchema.js (format obligatoire: PascalCase + Schema.js)
- feature.helpers.js / feature.constants.js / feature.formatters.js: eviter par defaut, creer seulement si necessaire
- utils/: eviter par defaut, autorise uniquement si 2+ fichiers utilitaires reels

Regle de bascule dossier:
- 0-1 fichier d un type: rester a la racine
- 2+ fichiers d un type: creer le sous-dossier correspondant avec un index.js
- exception: models/ est toujours requis, sans condition de volume

Regle de taille de fichier:
- cible: moins de 500 lignes par fichier
- a partir de 500 lignes, planifier un split par responsabilite (ex: service principal + service.search/service.sync)

Contenu minimal attendu dans README.md:
- objectif fonctionnel de la feature
- endpoints exposes (resume)
- flux principal (requete -> service -> reponse)
- dependances internes (services/modules utilises)
- permissions appliquees via middleware central (sans fichier permissions local)

Contenu minimal attendu dans test.[feature].routes.mjs:
- authentification reelle (token frais)
- test de chaque endpoint actif de la feature
- validation des status codes attendus
- resume pass/fail/error/skipped
- execution possible en one-shot (node test.[feature].routes.mjs)

## Conventions De Nommage

- dossiers: kebab-case
- fichiers metier: feature.type.js
- routes: feature.routes.js
- schemas: PascalCaseSchema.js (ex: ContactsSchema.js)
- classes: PascalCase (FeatureController, FeatureService)
- pas d alias redondants dans les exports
- tests: test.[feature].routes.mjs a la racine de la feature

## Regles D Integration

- index.js de feature exporte les points d entree publics
- index.js de feature peut exporter les routes de la feature (point d entree officiel)
- index.js de feature exporte le reutilisable cross-feature + les routes, sans alias legacy
- si un sous-dossier existe, il doit avoir son index.js
- pas d import circulaire via index.js depuis les sous-dossiers
- models/ est obligatoire et ne doit pas contenir de index.js
- routes proteges via createRoutePresets + permissionBase (pattern standard)
- ne pas creer de fichier ou dossier permissions dans la feature
- reutiliser le middleware central server/shared/middleware/permissions.js

### Pattern Routes avec Permissions (Obligatoire)

Utiliser `createRoutePresets({ permissionBase: 'xxx' })` pour generer les middleware d'auth + permission:

```js
import { createRoutePresets } from '../../../shared/middleware/index.js';

const mw = createRoutePresets({ permissionBase: 'accounts' });
// Genere: mw.read, mw.write, mw.manage
// Chaque stack = [limiter, authenticateToken, requirePermission('accounts.view|edit|manage')]

router.get('/', ...mw.read, Controller.getAll);       // accounts.view
router.post('/', ...mw.manage, Controller.create);    // accounts.manage
router.put('/:id', ...mw.write, Controller.update);   // accounts.edit
router.delete('/:id', ...mw.manage, Controller.delete); // accounts.manage
```

3 niveaux de permissions disponibles (alignes sur le registre central):
- `mw.read` → `{base}.view` (lecture)
- `mw.write` → `{base}.edit` (modification)
- `mw.manage` → `{base}.manage` (creation, suppression, actions admin)

Ne jamais utiliser `routePresets.custom()` sauf si un 4e niveau est justifie et ajoute au permissions-registry.
- ne pas extraire en helpers/constants/formatters sans duplication ou complexite justifiee
- si un fichier depasse 500 lignes, decouper en fichiers metier focalises
- maintenir un README.md a jour a la racine de la feature

Regles endpoints et legacy:
- preferer des routes explicites (ex: /:id/history) aux routes dynamiques catch-all (ex: /:id/:feature)
- toute route non utilisee cote portail/client doit etre candidate a suppression complete
- suppression complete = route + controller + service + validation + exports + tests + README
- ne pas garder un schema de validation ou une methode service non branchee "au cas ou"
- toute suppression de route doit verifier les usages cross-feature backend avant suppression

## Procedure D Audit

1. Lister les dossiers/fichiers existants pour la feature.
2. Verifier la regle lean racine vs sous-dossiers (2+ fichiers).
3. Comparer au template standard.
4. Relever les ecarts de nommage (routes/services/index).
5. Verifier la coherence des exports (index.js dossier + feature).
6. Verifier les fichiers > 500 lignes et proposer un decoupage.
7. Verifier que models/ existe et que le schema suit le format ContactsSchema.js.
8. Verifier la presence/qualite du README.md de feature.
9. Construire une matrice Route -> usage client -> usage backend cross-feature.
10. Identifier le code legacy: routes non appelees, handlers morts, services non references, schemas non branches, exports inutiles.
11. Verifier la presence et la qualite du test.[feature].routes.mjs.
12. Produire un plan atomique de refactorisation/suppression.

## Checklist De Validation

- pas de dossier permissions
- fichiers uniques gardes a la racine (lean)
- sous-dossier cree uniquement si 2+ fichiers du meme type
- si sous-dossier present, index.js present dans ce sous-dossier
- models/ present dans toutes les features
- schema nomme en PascalCaseSchema.js (ex: ContactsSchema.js)
- aucun models/index.js
- fichier routes au format feature.routes.js
- exports de feature clairs et non dupliques
- index.js racine exporte les routes + exports reutilisables cross-feature
- aucun alias legacy dans index.js (ex: pas de double export routes/contactsRoutes)
- imports non circulaires
- conventions de nommage respectees
- usage helpers/constants/formatters minimal et justifie
- pas de utils/ sans besoin reel (2+ fichiers utilitaires)
- aucun fichier ne depasse 500 lignes (ou split planifie)
- README.md present a la racine de la feature
- README.md decrit objectif, flux, endpoints et dependances
- test.[feature].routes.mjs present a la racine
- test.[feature].routes.mjs couvre tous les endpoints actifs
- matrice d usage des routes produite avant suppression
- aucune route dynamique catch-all inutile
- aucun export/service/schema legacy non utilise
- en cas de suppression de route: tests feature passes + log serveur verifie

## Workflow De Suppression Legacy (Obligatoire)

1. Produire la matrice d usage des routes (client + backend cross-feature).
2. Marquer chaque route: keep | remove | verify.
3. Supprimer la route candidate dans routes.
4. Supprimer handler controller associe.
5. Supprimer logique service et imports associes.
6. Supprimer schema(s) validation non branches.
7. Nettoyer exports index.js et imports consumers.
8. Mettre a jour README.md et test.[feature].routes.mjs.
9. Valider avec diagnostics + execution test.[feature].routes.mjs + lecture app.log.

## Validation Finale Obligatoire

Pour toute modif structurelle/legacy:
- get_errors sur fichiers modifies
- execution du test de feature a la racine (test.[feature].routes.mjs)
- verification de server/logs/app.log apres execution
- si echec: corriger avant cloture
- alignement confirme avec le contrat portal-feature-architect (feature flag, permissions, guards)

## Sortie Attendue

Pour chaque audit:
1. Etat: Compliant | Refactor Needed | Non-Compliant
2. Ecarts: liste concrete par fichier
3. Plan: etapes de refactorisation ordonnees
4. Validation: checklist PASS/FAIL
5. Alignement cross-skill: portal-feature-architect PASS/FAIL, route-permission-sync PASS/FAIL/N/A

## Priorite De Refactorisation Recommandee

1. crm
2. communication
3. finances
4. project-management
5. system
6. portal-specific
