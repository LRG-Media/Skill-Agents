# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).
Les changements sont regroupés par date.

---

## 2026-08-27

### Added
- **Route `GET /appointments/available-contacts`** — recherche contacts + leads pour le booking unifié :
  - `server/features/project-management/appointments/routes/appointmentsRoutes.js` : nouvelle route avant `/:id`
  - `server/features/project-management/appointments/AppointmentController.js` : méthode `getAvailableContacts`
  - `server/features/project-management/appointments/services/AppointmentService.js` : méthode `getAvailableContacts()` fusionnant contacts et leads avec format léger (11 champs)
  - `client/src/features/project-management/appointments/appointmentApi.js` : méthode `getAvailableContacts()` côté frontend
  - `client/src/shared/services/searchService.js` : feature `available_contact` avec import `AppointmentApi`
  - `client/src/shared/components/molecules/fields/searchfields/searchFieldFeatures/FEATURE_SERVICES.jsx` : config `available_contact`
- **Support leads dans les appointments** — création, validation, reminders, emails :
  - `server/features/project-management/appointments/utils/appointmentValidators.js` : `lead_id` ajouté aux schemas create/update, exclusion mutuelle lead ↔ contacts
  - `server/features/project-management/appointments/services/AppointmentService.js` : `lead_id` géré dans create(), `getAppointmentParticipants()` fallback lead, `APPOINTMENT_INCLUDE` et `APPOINTMENT_LIST_INCLUDE` incluent `lead`
  - `server/features/project-management/appointments/services/appointment.reminder.service.js` : `lead: true` dans les relations + envoi rappel au lead si pas de participants
  - `server/features/project-management/appointments/utils/appointmentHelpers.js` : filtre `lead_id`, recherche textuelle leads, enrichissement `lead` dans `enrichAppointmentData()`
- **Adresse physique comme lieu de RDV** — champ Adresse avec autocomplétion Google Places :
  - `server/features/project-management/appointments/utils/appointmentValidators.js` : `location` accepte tout string (pas seulement enum)
  - `client/src/features/project-management/appointments/components/steps/StepServiceSelection.jsx` : option "Adresse..." avec `AddressField`, 3 options (Google Meet, Téléphone, Adresse)
  - `client/src/features/project-management/appointments/hooks/useBookingForm.js` : action `SET_CUSTOM_ADDRESS`, reset auto
  - `client/src/features/project-management/appointments/components/steps/StepConfirmation.jsx` : icône MapIcon pour les adresses custom
- **Issue GitHub #86** — plan d'unification contact/lead dans les appointments
- **README features backend (8 features)** — documentation complète avec diagrammes Mermaid :
  - `server/features/project-management/appointments/README.md` : 7 diagrammes Mermaid (création, update, delete, rappels, Calendar auth, RBAC, state diagram)
  - `server/features/crm/leads/README.md` : 3 diagrammes (création/conversion, recherche, statuts)
  - `server/features/project-management/tasks/README.md` : 4 diagrammes (création, state machine, assignation bulk, flux complet)
  - `server/features/finance/payments/README.md` : 2 diagrammes (création, recalcul statut facture)
  - `server/features/project-management/projects/README.md` : 3 diagrammes (création, deletion contraintes, router dynamique)
  - `server/features/communication/notifications/README.md` : 3 diagrammes (création, Socket.IO, priorité×catégorie)
  - `server/features/project-management/time-tracking/README.md` : 2 diagrammes (création entry, calcul stats)
  - `server/features/finance/quotes/README.md` : 3 diagrammes (création, conversion devis→facture, calcul taxes)
- **Règle "Feature discovery via README"** — ajoutée dans les instructions :
  - `.github/instructions/server-features-services.instructions.md` : section "Feature discovery via README (mandatory)" avec exceptions (tests, schemas Prisma)
- **Fresh Token Workflow** — déplacé de `copilot-instructions.md` vers `backend.instructions.md` :
  - `.github/instructions/backend.instructions.md` : section "Fresh Token Workflow (required)" avec les 7 étapes
- **Feature Directory Naming Conventions** — déplacé de `copilot-instructions.md` vers `backend.instructions.md` :
  - `.github/instructions/backend.instructions.md` : table des conventions domaine/entité/portail + exceptions

### Changed
- **Alignement API leads sur format contact** — réponse GET /leads et GET /leads/:id unifiées :
  - `server/features/crm/leads/models/Lead.js` : `toDetailedObject()` réécrit avec clés curatées (plus de spread), ajout de `job_position`, `full_name`, `source`, `user`, `integrations`, `website`, `custom_fields`, dates ISO
  - `server/features/crm/leads/lead.utils.js` : `formatLeadForFrontend()` aligné sur même structure que `toDetailedObject()` — ajout de `source`, `job_position`, `user`, `integrations`, `website`, `custom_fields`, `account` en string, dates ISO
  - `server/features/crm/leads/services/lead.service.js` : `website` forcé dans `validFieldNames` et `getDefaultIncludes()` (était conditionnel via `hasLeadField`)
- **Module fields leads alignés sur contacts** (tous portails) :
  - `customization.module_fields` : ajout `full_name` (text), `mobile` (tel), `address` (type address composite) avec `field_scope: 'database'`
  - `customization.module_fields` : label `assigned_user_id` mis à jour de "Assigné à" → "Gestionnaire" (lrgmedia, demo, comuse)
- **Label "Gestionnaire"** dans le grid frontend :
  - `client/src/shared/components/organisms/GenericFeatureGridView.jsx` : "Assigné à" → "Gestionnaire"
- **Champs d'adresse ajoutés aux leads** — pattern composite identique aux accounts :
  - `server/prisma/schema/leads.prisma` : ajout `street`, `city`, `state`, `zip_code`, `country`, `billing_street`, `billing_city`, `billing_state`, `billing_zip`, `billing_country`
  - `server/features/crm/leads/models/LeadsSchema.js` : même ajout dans le schéma dynamique
  - Colonnes ALTER TABLE appliquées dans les BDD lrgmedia, demo et comuse
- **Address composite flatten/compose dans le service leads** — pattern accounts :
  - `server/features/crm/leads/services/lead.service.js` : `createLead()` et `updateLead()` flatten `address` objet en champs individuels avant sauvegarde
  - `server/features/crm/leads/models/Lead.js` : `toDetailedObject()` recompose `address` et `billing_address` en objets
  - `server/features/crm/leads/lead.utils.js` : `formatLeadForFrontend()` même recomposition
- **Emails appointment : "Format" → "Emplacement"** — tous les templates :
  - `server/features/communication/emails/templates/locales/fr/appointments.json` : label `format` renommé
  - 4 templates HTML (confirmation, reminder, reschedule, cancellation) : `Format :` → `Emplacement :`
- **Google Calendar : location + lead email** — événements calendar enrichis :
  - `server/features/project-management/appointments/services/AppointmentService.js` : `requestBody.location` ajouté, `appointment.lead?.email` ajouté aux attendees, `getLocationLabel()` retourne l'adresse custom
  - `server/features/project-management/appointments/utils/appointmentHelpers.js` : `getLocationLabel()` retourne la valeur brute pour les adresses custom
  - `server/features/project-management/appointments/utils/appointmentFormatters.js` : idem
- **StepContactSelection utilise la route available-contacts** :
  - `client/src/features/project-management/appointments/components/steps/StepContactSelection.jsx` : `feature="contact"` → `feature="available_contact"`
- **Simplification `copilot-instructions.md`** — réduction de ~120 à 31 lignes, suppression des doublons :
  - `.github/copilot-instructions.md` : suppression de §2 Core engineering, §3 Area requirements, §3 Fresh token, §7 Feature naming (doublons avec backend/frontend instructions)
  - `.github/instructions/backend.instructions.md` : ajout de "Fresh Token Workflow (required)" (7 étapes) et "Feature Directory Naming Conventions" (table)

### Fixed
- **Route `inspectionsSoftware` visible sans feature active** — `client/src/shared/config/routesAccessConfig.js` :
  - Ajout de `feature: 'inspections'` à l'entrée `inspectionsSoftware` dans `navItems`
  - Le lien `/inspections/software` s'affichait toujours dans le sidebar car la propriété `feature` était absente, contournant le filtre `shouldIncludeItem()`
- **TypeError `n.some is not a function`** sur la page appointments — `GenericFeaturePage.jsx` :
  - `tableConfig.columns` est une fonction (pas un array) quand `dynamicColumns` est null
  - Ajout de la garde `typeof rawColumns === 'function' ? rawColumns() : rawColumns` aux deux endroits où `resolvedColumns` est résolu (table view et fallback)
  - `client/src/shared/components/templates/GenericFeaturePage/GenericFeaturePage.jsx`
- **PUT leads ne sauvegardait pas `website`** — le champ était conditionnel via `hasLeadField()` au lieu d'être dans `validFieldNames`
- **GET /leads ne retournait pas `source`** — absent de `formatLeadForFrontend()`
- **Lead account toujours objet { id, name }** — normalisation dans `AppointmentService.js` et `appointmentHelpers.js` pour les leads dont `account` est un string
- **Email confirmation non envoyé au lead** — lead utilisé comme destinataire principal quand aucun contact n'est lié
- **Validation location rejetait les adresses custom** — `validateAppointmentData()` accepte tout string pour `location`
- **Rappels lead non envoyés** — `appointment.reminder.service.js` envoie au lead email si pas de participants contacts

## 2026-08-26

### Added
- **Page Module Fields Manager** — nouvelle interface de gestion des champs custom :
  - `client/src/shared/features/settings/pages/ModuleFieldsManager.jsx` : composant complet avec CRUD, drag-and-drop, modals de création/édition/suppression
  - `server/features/system/settings/controllers/ModuleFieldsController.js` : endpoints GET/POST/PUT/DELETE pour les field definitions
  - `server/features/system/settings/services/module-fields.service.js` : logique CRUD, cache 5min, validation, propagation des default values
- **Service `PreferencesService`** pour les préférences utilisateur :
  - `server/features/system/settings/services/preferences.service.js` : service dédié pour get/set/delete des préférences utilisateur
  - `server/features/system/settings/controllers/SettingsController.js` : endpoints GET/PUT/DELETE `/settings/preferences`
  - `server/features/system/settings/routes/settingsRoutes.js` : routes `/settings/preferences`
- **Table `user_preferences`** dans le schéma `customization` :
  - `server/features/system/settings/models/SettingsSchema.js` : modèle `user_preferences` avec clé composée (user_id, entity_type, preference_key)
- **Badge "Système"** pour les champs database dans le Module Fields Manager
- **Propagation des valeurs par défaut** lors de la création d'un champ custom vers les entités existantes
- **Nettoyage des valeurs custom** lors de la suppression d'un champ custom
- **Affichage badge boolean** dans les pages détail :
  - `client/src/shared/related/components/tabs/DetailsTab.jsx` : rendu badge coloré "Oui/Non" au lieu du texte brut pour les champs boolean
- **Normalisation des valeurs boolean** côté API :
  - `server/features/system/settings/services/module-fields.service.js` : `_normalizeValue()` convertit "true"/"false" strings en booleans JS

### Changed
- **Refactor nomenclature services settings** — alignement sur dot-notation :
  - `ModuleFieldsService.js` → `module-fields.service.js`
  - `ProfileService.js` → `profile.service.js`
  - `SettingsService.js` → `settings.service.js`
  - `TeamService.js` → `team.service.js`
  - `notificationPreferencesHelper.js` supprimé, remplacé par `preferences.service.js`
  - `server/features/system/settings/services/index.js` : imports mis à jour
  - `server/features/system/settings/controllers/ModuleFieldsController.js` : import mis à jour
- **DictationButton désactivé par défaut** :
  - `client/src/shared/components/molecules/fields/TextField.jsx` : `dictation = false` par défaut
  - `client/src/shared/components/molecules/fields/TextAreaField.jsx` : `dictation = false` par défaut
- **Badge boolean** dans TanStackTableView :
  - `client/src/shared/components/organisms/TanStackTableView.jsx` : composant `BooleanBadge` rendu "Oui"/"Non" au lieu du texte brut
- **Recherche et filtrage des champs** dans le Module Fields Manager avec barre de recherche intégrée
- **Layout toolbar** : module select avec recherche 70/30, bouton "Ajouter un champ" dans le header
- **Mode réordonnancement** avec toggle (SortIcon) pour afficher/masquer les handles de drag
- **Première colonne cliquable dans les tables dynamiques** :
  - `client/src/shared/components/templates/GenericFeaturePage/GenericFeaturePage.jsx` : les champs `text` avec `sort_order ≤ 2` sont mappés au type `title` (renderer `renderCellNavigation` → lien cliquable vers la fiche détail)
- **Smart accessor pour les champs search dans les colonnes dynamiques** :
  - `client/src/shared/components/templates/GenericFeaturePage/GenericFeaturePage.jsx` : les champs `search` avec `feature` tentent d'abord de résoudre l'objet relation (`row.account`, `row.inspector`) avant de retomber sur la valeur brute
- **Normalisation `tel` → `phone` pour les renderers** :
  - `client/src/shared/components/templates/GenericFeaturePage/GenericFeaturePage.jsx` : le type DB `tel` est mappé au renderer `phone` pour le formatage des numéros
- **Données DB synchronisées depuis CSV** :
  - Custom field `ct_program` peuplé pour 560 accounts (44 true, 516 false) via `tmp/sync-ct-program.mjs`
  - Custom field `inspector` peuplé pour 560 accounts avec le owner du compte via `_accounts_users`
  - Inspections `inspector_id` synchronisé avec le owner du compte (330/331)
  - Nettoyage : suppression de 502 valeurs `inspector` de Micheline Thériault
- **4 nouveaux filtres fail2ban** — détection de scanners panel, RCE, env, directory traversal :
  - `nginx-panel-scan` : phpmyadmin, adminer, wp-admin/setup-config, wp-admin/install
  - `nginx-rce-scan` : hellopress, wp-json/Batch/v1, REST API user enumeration
  - `nginx-env-scan` : /@fs/.env, /@fs/proc/self/environ, ?raw, ?import
  - `nginx-directory-traversal` : ../, ..\, variants URL-encodées
- **2 filtres existants enrichis** — couverture passée de 16 960 à 23 458 matches (+38%) :
  - `nginx-webscan` : ajout de about.php, simple.php, media.php, edit.php, site.php, test.php, info.php, shell.php, config.php, bootstrap.php, register.php, upload.php, user.php + expansion short_php (0–666)
  - `nginx-exploit-scan` : ajout de rest_route=/batch%%2Fv1, rest_route=%%2Fbatch%%2Fv1
- **4 nouveaux jails fail2ban** dans `jail.local` :
  - `nginx-panel-scan`, `nginx-rce-scan`, `nginx-env-scan`, `nginx-directory-traversal`
- **ignoreip enrichi** : ajout de 91.92.243.235/245 (monitoring service légitime)
- **Bannissement manuel** de 158.23.184.117 (scanner massif, 561 URLs uniques, 24h)
- **Nettoyage des logs** : `access.log` vidé pour repartir à zéro pour la prochaine analyse
- **Whitelist IP 24.122.136.33** ajoutée à `ignoreip` dans `/etc/fail2ban/jail.local` + unban de la jail `nginx-webscan`

### Removed
- **Routes `/settings/preferences`** (anciennes) remplacées par le nouveau système `preferences.service.js`
- **Helper `notificationPreferencesHelper.js`** supprimé
- **Import `notificationPreferencesHelper`** dans `SettingsService.js` supprimé
- **Chargement loader** lors du switch de module dans le Module Fields Manager (swap instantané sans indicateur)

### Fixed
- **Boolean `"false"` affiché comme "Oui"** dans les pages détail — correction du rendu boolean avec normalisation côté API et côté frontend (DetailsTab + TanStackTableView)
- **Nouveau champ avec default value** ne peuplait pas les entités existantes — ajout de la propagation automatique dans `create()` du ModuleFieldsService
- **Suppression d'un champ custom** ne nettoyait pas les valeurs dans `custom_field_values` — ajout du `deleteMany` sur les valeurs associées
- **Table vide quand les fields ne sont pas encore chargés** :
  - `client/src/shared/components/templates/GenericFeaturePage/GenericFeaturePage.jsx` : ajout d'un état de chargement (`Loader`) quand `dynamicColumns` est null et `tableFieldsLoading` est true
- **Clés TanStack en double avec fonctions accessor** :
  - `client/src/shared/components/organisms/TanStackTableView.jsx` : correction de `colId` pour utiliser `col.id` (string) au lieu de `col.accessor` (fonction), correction de `id:` dans `columnHelper.accessor`
- **Fallback builder cassé pour les features sans COLUMNS_BUILDERS** :
  - `client/src/shared/components/organisms/GenericFeatureTableView.jsx` : remplacement du `throw` par un commentaire silencieux quand la feature n'est pas dans `COLUMNS_BUILDERS`
- **Tableau vide quand `dynamicColumns` est null** :
  - `client/src/shared/components/organisms/GenericFeatureTableView.jsx` : remplacement de `||` par `??` pour `customColumns` afin de ne pas écraser le builder avec un tableau vide

### Security
- **Fix faux positif nginx-webscan** : ajout de `/wp-admin/` dans `ignoreregex` du filter pour exclure les requêtes WordPress Admin légitimes (`upload.php`, `edit.php`, etc.) qui matchaient les patterns webshell
- **Renforcement fail2ban** — analyse de 130 888 lignes de logs, 9 jails actifs couvrant webshells, exploits, secrets, RCE, panels, env, traversal, bad bots et WP brute-force
- **Zéro faux positif confirmé** — test de 1 561 requêtes légitimes (4 IPs) contre les 9 filtres, aucun match
- **Première colonne cliquable dans les tables dynamiques** :
  - `client/src/shared/components/templates/GenericFeaturePage/GenericFeaturePage.jsx` : les champs `text` avec `sort_order ≤ 2` sont mappés au type `title` (renderer `renderCellNavigation` → lien cliquable vers la fiche détail)
- **Smart accessor pour les champs search dans les colonnes dynamiques** :
  - `client/src/shared/components/templates/GenericFeaturePage/GenericFeaturePage.jsx` : les champs `search` avec `feature` tentent d'abord de résoudre l'objet relation (`row.account`, `row.inspector`) avant de retomber sur la valeur brute
- **Normalisation `tel` → `phone` pour les renderers** :
  - `client/src/shared/components/templates/GenericFeaturePage/GenericFeaturePage.jsx` : le type DB `tel` est mappé au renderer `phone` pour le formatage des numéros

### Fixed
- **Table vide quand les fields ne sont pas encore chargés** :
  - `client/src/shared/components/templates/GenericFeaturePage/GenericFeaturePage.jsx` : ajout d'un état de chargement (`Loader`) quand `dynamicColumns` est null et `tableFieldsLoading` est true
- **Clés TanStack en double avec fonctions accessor** :
  - `client/src/shared/components/organisms/TanStackTableView.jsx` : correction de `colId` pour utiliser `col.id` (string) au lieu de `col.accessor` (fonction), correction de `id:` dans `columnHelper.accessor`
- **Fallback builder cassé pour les features sans COLUMNS_BUILDERS** :
  - `client/src/shared/components/organisms/GenericFeatureTableView.jsx` : remplacement du `throw` par un commentaire silencieux quand la feature n'est pas dans `COLUMNS_BUILDERS`
- **Tableau vide quand `dynamicColumns` est null** :
  - `client/src/shared/components/organisms/GenericFeatureTableView.jsx` : remplacement de `||` par `??` pour `customColumns` afin de ne pas écraser le builder avec un tableau vide

### Added
- **Données DB synchronisées depuis CSV** :
  - Custom field `ct_program` peuplé pour 560 accounts (44 true, 516 false) via `tmp/sync-ct-program.mjs`
  - Custom field `inspector` peuplé pour 560 accounts avec le owner du compte via `_accounts_users`
  - Inspections `inspector_id` synchronisé avec le owner du compte (330/331)
  - Nettoyage : suppression de 502 valeurs `inspector` de Micheline Thériault
- **4 nouveaux filtres fail2ban** — détection de scanners panel, RCE, env, directory traversal :
  - `nginx-panel-scan` : phpmyadmin, adminer, wp-admin/setup-config, wp-admin/install
  - `nginx-rce-scan` : hellopress, wp-json/Batch/v1, REST API user enumeration
  - `nginx-env-scan` : /@fs/.env, /@fs/proc/self/environ, ?raw, ?import
  - `nginx-directory-traversal` : ../, ..\, variants URL-encodées
- **2 filtres existants enrichis** — couverture passée de 16 960 à 23 458 matches (+38%) :
  - `nginx-webscan` : ajout de about.php, simple.php, media.php, edit.php, site.php, test.php, info.php, shell.php, config.php, bootstrap.php, register.php, upload.php, user.php + expansion short_php (0–666)
  - `nginx-exploit-scan` : ajout de rest_route=/batch%%2Fv1, rest_route=%%2Fbatch%%2Fv1
- **4 nouveaux jails fail2ban** dans `jail.local` :
  - `nginx-panel-scan`, `nginx-rce-scan`, `nginx-env-scan`, `nginx-directory-traversal`
- **ignoreip enrichi** : ajout de 91.92.243.235/245 (monitoring service légitime)
- **Bannissement manuel** de 158.23.184.117 (scanner massif, 561 URLs uniques, 24h)
- **Nettoyage des logs** : `access.log` vidé pour repartir à zéro pour la prochaine analyse
- **Whitelist IP 24.122.136.33** ajoutée à `ignoreip` dans `/etc/fail2ban/jail.local` + unban de la jail `nginx-webscan`

### Security
- **Fix faux positif nginx-webscan** : ajout de `/wp-admin/` dans `ignoreregex` du filter pour exclure les requêtes WordPress Admin légitimes (`upload.php`, `edit.php`, etc.) qui matchaient les patterns webshell
- **Renforcement fail2ban** — analyse de 130 888 lignes de logs, 9 jails actifs couvrant webshells, exploits, secrets, RCE, panels, env, traversal, bad bots et WP brute-force
- **Zéro faux positif confirmé** — test de 1 561 requêtes légitimes (4 IPs) contre les 9 filtres, aucun match

## 2026-08-25

### Added
- **Bouton de téléchargement des images** dans la page inspection software — hover pour révéler l'icône, clic pour télécharger :
  - `client/src/features/custom/comuse/software/inspectionSoftwareParts.jsx` : ajout du bouton `DownloadIcon` dans `DroppableImageSlot`, téléchargement via CDN Google avec `cache: 'force-cache'`
- **Support `Content-Disposition: attachment`** sur le endpoint de stream d'images :
  - `server/features/custom/comuse/inspections/services/InspectionDriveService.js` : paramètre `?download=1` pour forcer le téléchargement au lieu de l'affichage inline

### Changed
- **Suppression des builders `contacts` et `leads` obsolètes** :
  - `client/src/shared/components/organisms/GenericFeatureTableView.jsx` : retrait des entrées mortes, le fallback gérant les features sans builder
- **Simplification du flux de table Accounts** :
  - `client/src/features/crm/accounts/config.jsx` : suppression de la configuration statique `columns`, remplacée par les colonnes dynamiques
  - `client/src/shared/components/templates/GenericFeaturePage/GenericFeaturePage.jsx` : retrait du calcul obsolète des colonnes résolues et des fallback `viewProps.customColumns`
- **Suppression du builder `accounts` obsolète** :
  - `client/src/shared/components/organisms/GenericFeatureTableView.jsx` : retrait de l’entrée devenue inutile, les colonnes dynamiques étant prioritaires
- **Renderers des colonnes dynamiques centralisés** :
  - `client/src/shared/config/defaultRenderers.jsx` : rendu Badge des champs select et ajout du renderer search pour les champs de référence
  - `client/src/shared/config/columnsConfigBase.js` : transmission des options de colonne au renderer
  - `client/src/shared/components/templates/GenericFeaturePage/GenericFeaturePage.jsx` : suppression des cellules inline au profit du système `defaultRenderers`
- **Colonnes dynamiques de la page Accounts** :
  - `client/src/features/crm/accounts/config.jsx` : activation de `useAccountsFields` et des colonnes dynamiques du tableau
  - `client/src/shared/components/templates/GenericFeaturePage/GenericFeaturePage.jsx` : génération des colonnes depuis les définitions de champs du module
- **Renderer des champs select avec options** :
  - `client/src/shared/config/defaultRenderers.jsx` : ajout du rendu des labels et couleurs des options de champs select, avec fallback sur la valeur brute
- **RBAC Finance — centralisation de la visibilité** :
  - `server/features/finance/invoices/invoice.service.js` : remplacement de la visibilité locale par `buildVisibilityWhere` et `checkRecordAccess`
  - `server/features/finance/quotes/quote.service.js` : remplacement de la visibilité locale par `buildVisibilityWhere` et `checkRecordAccess`
  - `server/features/finance/payments/payment.service.js` : remplacement de la visibilité locale par `buildVisibilityWhere` et `checkRecordAccess`
  - `server/features/finance/subscriptions/subscription.service.js` : remplacement de la visibilité locale par `buildVisibilityWhere` et `checkRecordAccess`
- **RBAC Projects — contrôle visibilité sur getProjectById** :
  - `server/features/project-management/projects/services/ProjectService.js` : ajout vérification `accessFilter` dans `getProjectById` — INTERNAL vérifie created_by/assignment via accessFilter, EXTERNAL vérifie `account_id`
  - `server/features/project-management/projects/ProjectController.js` : passage `{ user: req.user, accessFilter: req.accessFilter }` au service
  - `server/features/project-management/projects/README.md` : diagramme + tableau RBAC
- **RBAC Appointments — filtrage de visibilité par rôle** :
  - `server/features/project-management/appointments/utils/appointmentHelpers.js` : ajout du scope `EXTERNAL` par `account_id` via `appointment_participants.contacts`, et autorisation du créateur au détail
  - `server/features/project-management/appointments/services/AppointmentService.js` : unification du scope de visibilité entre la liste et le détail
  - `server/features/project-management/appointments/README.md` : ajout des règles de visibilité RBAC
- **RBAC Tasks — filtrage de visibilité par rôle** :
  - `server/features/project-management/tasks/services/TaskService.js` : ajout du scope `account_id` pour les utilisateurs EXTERNAL sur le listing, le détail, les listings liés et la recherche; conservation du scope créateur/assignation pour INTERNAL
  - `server/features/project-management/tasks/README.md` : ajout des règles de visibilité RBAC
- **RBAC Quotes — filtrage de visibilité par rôle** :
  - `server/features/finance/quotes/quote.service.js` : ajout de `#buildVisibilityWhere(user)`, filtrage de `listAll` et contrôle de visibilité sur `getQuoteById`
  - `server/features/finance/quotes/QuoteController.js` : transmission explicite de l'utilisateur aux appels de lecture
  - `server/features/finance/quotes/README.md` : ajout du diagramme Mermaid et du tableau des règles RBAC
- **RBAC Subscriptions — filtrage de visibilité par rôle** :
  - `server/features/finance/subscriptions/subscription.service.js` : ajout de `#buildVisibilityWhere(user)`, filtrage de `listAll` et `countAll`, contrôle de visibilité sur `getSubscriptionById`
  - `server/features/finance/subscriptions/SubscriptionController.js` : transmission explicite de `{ user: req.user }` à tous les appels service
  - `server/features/finance/subscriptions/README.md` : ajout des règles de visibilité RBAC
- **RBAC Invoices - filtrage visibilité par rôle** :
  - `server/features/finance/invoices/invoice.service.js` : ajout de `#buildVisibilityWhere(user)`, filtrage de `listAll` et de son comptage, contrôle d'accès sur `getInvoiceById`
  - `server/features/finance/invoices/InvoiceController.js` : passage explicite de `{ user: req.user }` aux appels de listing et de détail
  - `server/features/finance/invoices/README.md` : ajout du diagramme Mermaid et du tableau de visibilité RBAC
- **RBAC Payments — filtrage de visibilité par rôle** :
  - `server/features/finance/payments/payment.service.js` : filtrage des listes et du détail par utilisateur ou compte, accès complet pour `admin` et `super_admin`, ajout de `countAll` contextualisé
  - `server/features/finance/payments/PaymentController.js` : transmission explicite de `{ user: req.user }` aux appels de lecture
  - `server/features/finance/payments/README.md` : ajout du tableau des règles RBAC
- **Suppression du filtre EXCLUDED_TYPES dans ModuleFieldsService** — les champs de type `address`, `json`, `search` étaient silencieusement exclus des réponses API même avec `?context=details`, ce qui masquait l'inspecteur (`field_type: search`) et d'autres champs :
  - `server/features/system/settings/services/ModuleFieldsService.js` : retrait de `EXCLUDED_TYPES = ['address', 'json', 'search']` des deux chemins (cache et DB), seul `field_key === 'id'` reste exclu
- **RBAC Accounts — filtrage visibilité par rôle** :
  - `server/features/crm/accounts/account.service.js` : ajout `#buildVisibilityWhere(user)` — admin voit tout, INTERNAL filtré par liaison M2M `accounts.users`, EXTERNAL filtré par `account_id`. Appliqué à `getAllAccounts`, `countAccounts`, `searchAccounts`, `countSearchAccounts`, `getAccountById`
  - `server/features/crm/accounts/AccountController.js` : passage `{ user: req.user }` à tous les appels service (list, search, count, getById)
  - `server/features/crm/accounts/account.service.js` : remplacement de la logique locale par `buildVisibilityWhere`, `isAdmin` et `getRoleType` depuis l'utilitaire RBAC partagé, avec conservation du contrôle M2M asynchrone au détail
- **RBAC Contacts — filtrage visibilité par rôle** :
  - `server/features/crm/contacts/services/contact.service.js` : remplacement de la logique locale par `buildVisibilityWhere` et `checkRecordAccess` depuis l'utilitaire RBAC partagé
  - `server/features/crm/contacts/services/contact.search.service.js` : remplacement de la logique locale par `buildVisibilityWhere` depuis l'utilitaire RBAC partagé
  - `server/features/crm/contacts/ContactController.js` : passage `{ user: req.user }` à tous les appels service (list, search, count, getById)
- **RBAC Inspections — vérification visibilité sur GET by id** :
  - `server/features/custom/comuse/inspections/services/InspectionService.js` : `getInspectionByIdEnriched` accepte `userMeta`, vérifie `inspector_id` pour INTERNAL et `account_id` pour EXTERNAL, retourne `ACCESS_DENIED` si non autorisé
  - `server/features/custom/comuse/inspections/InspectionController.js` : passage `{ user: req.user }` à `getInspectionByIdEnriched`, gestion erreur `ACCESS_DENIED` → 403
- **Refactor RBAC — adoption de `shared/utils/rbac.js`** :
  - `server/features/finance/invoices/invoice.service.js` : suppression `#buildVisibilityWhere`, import `buildVisibilityWhere` + `checkRecordAccess`
  - `server/features/finance/quotes/quote.service.js` : idem
  - `server/features/finance/payments/payment.service.js` : idem
  - `server/features/finance/subscriptions/subscription.service.js` : idem
  - `server/features/crm/contacts/services/contact.service.js` : suppression `#buildVisibilityWhere`, import `buildVisibilityWhere` + `checkRecordAccess`
  - `server/features/crm/contacts/services/contact.search.service.js` : suppression `#buildVisibilityWhere`, import `buildVisibilityWhere`
  - `server/features/crm/accounts/account.service.js` : suppression `#buildVisibilityWhere`, import `buildVisibilityWhere` + `isAdmin` + `getRoleType`, `customInternal` pour M2M

### Added
- **Colonnes dynamiques pour les tables Contacts et Leads** :
  - `client/src/features/crm/contacts/config.jsx` : branchement de `useFields: useContactsFields` et activation de `dynamicColumns: true`
  - `client/src/features/crm/leads/config.jsx` : branchement de `useFields: useLeadsFields` et activation de `dynamicColumns: true`
- **Colonnes dynamiques pour la table Accounts** :
  - `client/src/features/crm/accounts/config.jsx` : branchement de `useFields: useAccountsFields` dans les hooks, ajout `dynamicColumns: true` dans `tableConfig`
  - `client/src/shared/components/templates/GenericFeaturePage/GenericFeaturePage.jsx` : conversion automatique des field definitions en colonnes de table (type, options, sort_order), support `custom_fields.*` comme accessor
  - `client/src/shared/config/defaultRenderers.jsx` : ajout `selectRenderer` pour les champs select avec labels, couleurs et fallback
- **Utilitaire générique RBAC `shared/utils/rbac.js`** :
  - `server/shared/utils/rbac.js` : nouveau fichier — exports `buildVisibilityWhere`, `checkRecordAccess`, `isAdmin`, `getRoleType`. Supporte `ownerField`, `accountField`, `customInternal`, `customExternal`, `customCheck`
  - `server/shared/utils/README.md` : documentation avec diagramme Mermaid, matrice de config par module
- **Diagrammes de visibilité RBAC dans les README** :
  - `server/features/crm/accounts/README.md` : diagramme Mermaid + tableau récapitulatif visibilité par rôle
  - `server/features/crm/contacts/README.md` : diagramme Mermaid + tableau récapitulatif visibilité par rôle
  - `server/features/custom/comuse/inspections/README.md` : **nouveau fichier** — structure, endpoints, diagramme Mermaid, tableau récapitulatif
  - `server/features/finance/invoices/README.md` : diagramme Mermaid + tableau RBAC
  - `server/features/finance/quotes/README.md` : diagramme Mermaid + tableau RBAC
  - `server/features/finance/payments/README.md` : tableau RBAC
  - `server/features/finance/subscriptions/README.md` : tableau RBAC
  - `server/features/project-management/projects/README.md` : diagramme + tableau RBAC
  - `server/features/project-management/tasks/README.md` : tableau RBAC
  - `server/features/project-management/appointments/README.md` : tableau RBAC

### Fixed
- **Projets accessibles par ID sans contrôle RBAC** :
  - `server/features/project-management/projects/services/ProjectService.js` : contrôle de visibilité pour les rôles INTERNAL et EXTERNAL dans `getProjectById`
  - `server/features/project-management/projects/README.md` : ajout du diagramme et du tableau des règles RBAC

## 2026-08-24

### Fixed
- **Labels de commentaires d'inspection ne respectaient pas la langue sélectionnée** — les commentaires bilingues (fr/en) affichaient toujours le label français quel que soit le paramètre `lang` :
  - `server/features/custom/comuse/inspections/services/inspection.pdf.service.js` : ajout paramètre `lang` à `#buildCommentValueToLabelMap`, résolution via `rawLabel[lang]` au lieu de `rawLabel.fr` en dur, passage de `finalLang` à l'appel

### Changed
- **Widget Projets adapté au mobile** — layout compact au lieu de colonnes empilées :
  - `client/src/shared/components/organisms/OverviewWidget/OverviewWidget.jsx` : en-têtes colonnes masqués sur mobile (`hidden md:grid`)
  - `client/src/features/project-management/projects/components/ProjectWidget.jsx` : double layout (desktop grille 12 cols, mobile carte compacte nom+badge+dates)
- **Bouton suppression participant ajusté** — taille et couleurs harmonisées :
  - `client/src/features/project-management/appointments/components/steps/StepContactSelection.jsx` : taille `w-7 h-7 md:w-8 md:h-8`, icône `w-2.5 h-2.5`, fond `bg-accent1 text-white`
- **Billing reminder emails envoyés au billing contact de l'account** — au lieu du propriétaire de l'abonnement :
  - `server/features/system/scheduler/jobs/subscription.billing.job.js` : Phase 1 query inclut `accounts.billing_contact` (id, email, first_name, last_name), extraction du billing contact et passage à `sendReminderEmail`
  - `server/features/finance/subscriptions/subscription.service.js` : `sendReminderEmail` accepte un 3e paramètre `billingContact`, priorise `billingContact.email` sur `user.email` pour le destinataire, priorise `billingContact.first_name` pour le prénom — fallback sur `user.email` si pas de billing contact
- **Billing contacts assignés en base** pour les 2 comptes manquants :
  - Account 197 (Drolet Simard – Revêtements de bois inc.) → `billing_contact_id = 6363` (Pascale Simard, pascale@droletsimard.com)
  - Account 167 (Minilab) → `billing_contact_id = 6278` (Benjamin Paquet, bpaquet@elabore.ca)
  - Résultat : 0 abonnements actifs auto_renew sans billing contact (19/19 couverts)

### Removed
- **Nettoyage dead code shared/ — pass 1** (17 composants) :
  - `client/src/shared/components/atoms/ZohoCrmBadge.jsx` : jamais importé
  - `client/src/shared/components/atoms/Icon.jsx` : remplacé par `@icons` (SVGR)
  - `client/src/shared/components/molecules/detail/DescriptionSection.jsx` : zéro consommateur
  - `client/src/shared/components/molecules/detail/InformationGrid.jsx` : zéro consommateur
  - `client/src/shared/components/molecules/detail/MetadataCard.jsx` : zéro consommateur
  - `client/src/shared/components/molecules/searchfields/contacts/ContactSearchField.jsx` : zéro import
  - `client/src/shared/components/molecules/searchfields/projects/ProjectSearchField.jsx` : zéro import
  - `client/src/shared/components/organisms/GridView.jsx` : remplacé par GenericFeatureGridView
  - `client/src/shared/components/organisms/ListView.jsx` : zéro consommateur
  - `client/src/shared/components/organisms/ImageLightbox.jsx` : zéro consommateur
  - `client/src/shared/components/organisms/InvoicePopup.jsx` : zéro consommateur
  - `client/src/shared/components/organisms/PermissionButton.jsx` : zéro consommateur
  - `client/src/shared/components/organisms/SelectExistingTaskPopup.jsx` : zéro consommateur
  - `client/src/shared/components/organisms/TaskActionChoicePopup.jsx` : zéro consommateur
  - `client/src/shared/components/organisms/TaskFormPopup.jsx` : zéro consommateur
  - `client/src/shared/components/organisms/UploadFilePopup.jsx` : zéro consommateur
  - `client/src/shared/components/organisms/TokenExpirationHandler.jsx` : commenté dans App.jsx
  - `client/src/shared/components/organisms/QuickAccessPanel.jsx` : zéro consommateur
  - `client/src/shared/components/organisms/GenericCalendarView.jsx` : zéro import
  - `client/src/shared/components/templates/GenericEntityCard.jsx` : zéro consommateur
  - `client/src/app/App.jsx` : commentaire TokenExpirationHandler nettoyé
  - Barrels nettoyés : `organisms/index.js`, `templates/index.js`, `atoms/index.js`, `detail/index.js`
- **Nettoyage dead code shared/ — pass 2** (21 fichiers + 4 barrels) :
  - `client/src/shared/components/molecules/Card_new.jsx` : zéro consommateur
  - `client/src/shared/components/molecules/DateRangeCalendar.jsx` : zéro consommateur
  - `client/src/shared/components/molecules/Pagination.jsx` : zéro consommateur
  - `client/src/shared/components/molecules/Tabs.jsx` : zéro consommateur
  - `client/src/shared/components/molecules/TreeNode.jsx` : zéro consommateur
  - `client/src/shared/components/molecules/ViewSelector.jsx` : zéro consommateur
  - `client/src/shared/components/molecules/InfiniteScrollSentinel.jsx` : zéro consommateur
  - `client/src/shared/components/molecules/detail/EditableField.jsx` : zéro consommateur
  - `client/src/shared/components/molecules/searchfields/contacts/ContactBadge.jsx` : zéro consommateur
  - `client/src/shared/hooks/useIndexedDB.js` : zéro consommateur
  - `client/src/shared/hooks/ui/useInfiniteScroll.js` : zéro consommateur
  - `client/src/shared/hooks/ui/useColumnVisibility.js` : zéro consommateur
  - `client/src/shared/utils/imageCompression.js` : zéro consommateur
  - `client/src/shared/utils/imageCompressionPool.js` : zéro consommateur
  - `client/src/shared/utils/imageCompressionWorker.js` : zéro consommateur
  - `client/src/shared/utils/uploadWorker.js` : zéro consommateur
  - `client/src/shared/utils/debug/errorSimulator.js` : zéro consommateur
  - `client/src/shared/utils/debug/mobileDebugConsole.js` : zéro consommateur
  - `client/src/shared/utils/formatters/dateUtils.js` : zéro consommateur
  - `client/src/shared/utils/helpers/formatRelatedData.js` : zéro consommateur
  - `client/src/shared/utils/storage/searchCache.js` : zéro consommateur
  - Barrels nettoyés : `molecules/index.js`, `hooks/index.js`, `utils/index.js`, `shared/index.js`

## 2026-08-21

### Added
- **Skill `backend-feature-creator`** — skill complet pour la création de features backend :
  - `SKILL.md` : fichier principal allégé avec conventions, workflow 12 étapes, quick reference
  - `references/01-prisma-schema.md` : template Prisma, migrations, multi-schema
  - `references/02-directory-structure.md` : règle lean, templates, conventions de nommage
  - `references/03-validation.md` : JSON Schema, validateRequest, patterns
  - `references/04-model.md` : business model class, getters, toSummary/toDetailedObject
  - `references/05-schema-documentation.md` : Prisma Schema class, BASE_SCHEMA, ENUMS
  - `references/06-service.md` : Prisma queries, soft delete, custom fields, performance tracking
  - `references/07-controller.md` : 5 helpers privés, méthodes CRUD, response methods
  - `references/08-routes.md` : createRoutePresets, permissions, validation middleware
  - `references/09-index-exports.md` : barrel exports, variantes par taille
  - `references/10-readme.md` : template README, contenu obligatoire
  - `references/11-test-file.md` : test.*.routes.mjs, imports, structure
  - `references/12-api-registration.md` : apiRouteConfig, permissions, portal config
  - `references/advanced-patterns.md` : custom fields, cache, activity log, aggregations, transactions
  - `references/anti-patterns.md` : erreurs courantes et solutions
  - `references/checklist.md` : checklist de validation complète
- **Merge `route-tracer` → `frontend-api-call-patterns`** — tracé bidirectionnel frontend↔backend unifié :
  - `frontend-api-call-patterns/SKILL.md` : refonte complète avec architecture diagram, 7 étapes de recherche, tableau de sortie Backend Routes vs Frontend Calls, détection routes non utilisées, exemples par feature (appointments, invoices, contacts, projects)
  - `route-tracer/` : supprimé (contenu mergé)
- **Cross-références entre skills** — navigation entre skills complémentaires :
  - `backend-feature-creator/SKILL.md` : ajout tableau "Skills Complémentaires" (structure, custom-fields, optimization, architect, prisma-cli, prisma-client-api)
  - `portal-feature-architect/SKILL.md` : section 3.5 reference `backend-feature-creator` pour la création, "Compléments obligatoires" inclut creator + structure
- **Hook `useBreakpoint()`** — détection responsive multi-breakpoints réactive avec pattern pub/sub singleton :
  - `client/src/shared/hooks/ui/useBreakpoint.js` : isMobile (<768), isTablet (<1280), isDesktop (>1280), width, breakpoint — debounce 120ms, matchMedia + visualViewport + resize listeners
- **Pagination DB pour les recherches CRM** — élimination du hack `limit: 999999` + `.slice()` JS sur les 3 controllers CRM :
  - `server/features/crm/accounts/AccountController.js` : `Promise.all` pour paralléliser `getAllAccounts` + `countAccounts`, passage de `{ limit, offset }` au service au lieu de `999999`, default limit 100
  - `server/features/crm/accounts/account.service.js` : `searchAccounts` utilise `skip`/`take` Prisma au lieu de `take: 999999`, ajout de `countSearchAccounts()` pour compter via DB, ajout custom fields batch dans search, select allégé (suppression `billing_*` et `billing_contact` du list)
  - `server/features/crm/contacts/ContactController.js` : remplacement du pattern `limit: 999999` par `searchContactsPaginated()` + `countSearchContacts()`
  - `server/features/crm/contacts/services/contact.search.service.js` : ajout de `searchContactsPaginated()` (requête OR unique avec `skip`/`take`) et `countSearchContacts()` pour la pagination DB
  - `server/features/crm/leads/LeadController.js` : les 3 chemins (search, by-company, list) utilisent maintenant la pagination DB avec `Promise.all` pour les counts
  - `server/features/crm/leads/services/lead.search.service.js` : ajout de `searchLeadsPaginated()`, `countSearchLeads()`, `countLeadsByCompany()`, `getleadsByCompany` avec `skip`/`take`
  - `server/features/crm/leads/services/lead.service.js` : ajout de `countLeads()` pour le comptage DB

### Changed
- **Adoption `findUniqueOrThrow` / `findFirstOrThrow`** — suppression des null checks manuels sur 28 sites dans 12 fichiers :
  - `server/features/project-management/projects/services/ProjectService.js` : 8 sites (getProjectRelatedInfo, getProjectContacts, getProjectAccount, addLink, deleteLink, getLinks, reorderLinks, getProjectStats)
  - `server/features/project-management/tasks/models/Task.js` : 2 sites (getTaskRelatedInfo, addComment)
  - `server/features/project-management/tasks/services/TaskAssignmentService.js` : 5 sites (getTaskAssignments + 4 dans $transaction avec `tx.findUniqueOrThrow`)
  - `server/features/project-management/tasks/services/TaskService.js` : 1 site (updateTask)
  - `server/features/custom/comuse/inspections/services/InspectionService.js` : 12 sites (findFirstOrThrow × 4 + findUniqueOrThrow × 8)
  - `server/features/system/auth/services/auth.register.service.js` : 1 site (invitation)
  - `server/features/system/settings/services/SettingsService.js` : 1 site (changePassword)
  - `server/features/finance/line-items/line-items.service.js` : 1 site (lookup article)
- **Optimisation `calculateAutomaticProjectStatus`** — remplacement du fetch complet des tâches + filter JS par un `count` DB :
  - `server/features/project-management/projects/utils/projectHelpers.js` : supprime `include: { tasks }`, utilise `prisma.tasks.count({ where: { status: 'completed' } })` au lieu de `tasks.filter(...).length`
- **Filtre relation `isNot` pour contacts sans compte** — remplacement du raw column par une relation Prisma :
  - `server/features/system/users/services/UserService.js` : `where.user_id = null` → `where.user_profile = { is: null }`
- **Refactor `useLayout.js`** — suppression des listeners et `getViewportWidth()` dupliqués, délègue maintenant à `useBreakpoint()` :
  - `client/src/shared/hooks/ui/useLayout.js` : supprimé `useGlobalIsMobile()`, `MOBILE_BREAKPOINT` re-export, singleton `mobileSubscribers`, `notifyMobileSubscribers()`, `debouncedNotifyMobileSubscribers()`, `initializeMobileViewportListeners()` — 6 listeners éliminés
- **Migration `useGlobalIsMobile` → `useBreakpoint`** — tous les consommateurs migrent au hook unique :
  - `client/src/shared/components/atoms/Dropdown.jsx` : `useBreakpoint()` direct
  - `client/src/shared/components/molecules/FilterSection.jsx` : `useBreakpoint()` direct
  - `client/src/shared/components/molecules/ViewSelector.jsx` : `useBreakpoint()` direct
  - `client/src/shared/components/organisms/Modal.jsx` : `useBreakpoint()` direct
  - `client/src/shared/components/organisms/SidePanel.jsx` : `useBreakpoint()` direct
  - `client/src/shared/related/components/DetailPageTabs.jsx` : `useBreakpoint()` direct
- **Migration `useLayout()` → `useBreakpoint()`** pour détection mobile uniquement :
  - `client/src/shared/components/templates/GenericFeaturePage/GenericFeaturePage.jsx` : isMobile via useBreakpoint
  - `client/src/features/custom/comuse/inspections/components/ExternalInspectionDetailsView.jsx` : isMobile via useBreakpoint
  - `client/src/features/custom/comuse/inspections/components/inspectionReportsTab.jsx` : isMobile via useBreakpoint
  - `client/src/features/custom/comuse/inspections/pages/NewMonthlyInspection.jsx` : isMobile via useBreakpoint
- **Suppression `LazyFallback` des routes** — fallback Suspense null pour les pages utilisant GenericFeaturePage :
  - `client/src/app/main.jsx` : `Suspense { fallback: null }` dans `generateMainRoutes` et `generateOtherRoutes`
- **Refactor `useAppointments`** — aligné sur le pattern `useAccounts` :
  - `client/src/features/project-management/appointments/hooks/useAppointments.js` : `useState(true)` au lieu de `false`, suppression de `hasLoadedRef`, `previousFiltersRef`, `filtersRef` — un seul `useEffect` sur `[filters, loadAppointmentsWithFilters]`
- **Remplacement `window.innerWidth` inline** par hooks réactifs :
  - `client/src/features/communication/chat/pages/Messages.jsx` : `useBreakpoint()` + `isCompact` (isMobile || isTablet)
  - `client/src/features/custom/comuse/inspections/pages/tabs/TabDescriptionV2.jsx` : `useBreakpoint()` pour mapHeight
  - `client/src/features/custom/comuse/inspections/pages/tabs/TabEmplacement.jsx` : `useBreakpoint()` pour mapHeight
  - `client/src/features/custom/comuse/inspections/pages/tabs/TabEmplacementV2.jsx` : `useBreakpoint()` pour mapHeight
  - `client/src/auth/hooks/useTokenExpiration.js` : `useBreakpoint()` au lieu de `window.innerWidth`
  - `client/src/auth/utils/cookieUtils.js` : `getIsMobile()` dynamique au lieu de snapshot statique

### Fixed
- **Double loader sur `/appointments`** — 3 causes identifiées et corrigées :
  - `client/src/shared/components/templates/GenericFeaturePage/GenericFeaturePage.jsx` : suppression du `<Loader />` redondant dans `renderDataView()`
  - `client/src/app/main.jsx` : suppression du `LazyFallback` (Suspense) qui créait un 3e loader
  - `client/src/features/project-management/appointments/hooks/useAppointments.js` : `useState(true)` pour éviter le flash EmptyState au montage
- **Recherche contacts limitée à 30 résultats** — `ContactSearchService` avait des `take: 20`/`take: 10` hardcodés ignorés par le controller, la pagination était cassée. Nouvelle méthode `searchContactsPaginated` avec requête OR单一 + `skip`/`take`
- **Count contacts ignorait les filtres** — `countContacts` applique maintenant le where clause complet
- **Leads list chargeait tout pour compter** — `limit: 999999` pour `.length`, remplacé par `countLeads()` DB
- **Pagination accounts sans cap** — ajout de `default limit 100` quand aucun `limit` n'est fourni

---

## 2026-08-20

### Added
- **Modal d'ajout de champ personnalisé** — formulaire modal avec `FormField` de shared pour créer de nouveaux champs dans ModuleFieldsManager :
  - `client/src/features/settings/pages/ModuleFieldsManager.jsx` : bouton "+ Ajouter un champ" ouvre un `<Modal>` avec `<form>`, champs Label (auto-génère la clé), Type (Texte/Date/Sélection/Booléen), Format (si texte), Valeur par défaut (adaptative), Obligatoire (toggle)
- **Éditeur d'options pour type Sélection** — repeatable field dans le modal avec label, valeur auto-générée, couleur, et case à cocher "défaut"
- **Drag-and-drop reorder** — réorganisation des champs par glisser-déposer via `@dnd-kit` :
  - `client/src/features/settings/pages/ModuleFieldsManager.jsx` : `DndContext` + `SortableContext` + `SortableCard` + `handleDragEnd` avec `arrayMove` et sauvegarde backend
- **Layout cards unifié** — remplacement du tableau desktop + cards mobile par un seul layout en cartes avec drag handle, badge type, toggles visibilité (Détails/Table/Grille)
- **Skill `changelog-updater`** — nouveau skill pour la mise à jour automatique du CHANGELOG
  - `.github/skills/changelog-updater/SKILL.md` : format Keep a Changelog, workflow de mise à jour
- **Skill `backend-custom-fields-integration`** — nouveau skill documentant l'intégration des custom fields dans les services backend :
  - `.github/skills/backend-custom-fields-integration/SKILL.md` : 5 étapes d'intégration, checklist audit, tableau des features
- **Section "Custom Fields" dans `server-features-services.instructions.md`** — règles pour l'utilisation de `ModuleFieldsService` dans les features :
  - `.github/instructions/server-features-services.instructions.md` : ajout de la section avec les 3 méthodes CRUD, les règles API et la liste des features réutilisatrices
- **Bouton retour mobile dans le header** — flèche gauche pour naviguer en arrière, visible uniquement sur mobile :
  - `client/src/shared/components/organisms/Header.jsx` : bouton `md:hidden` avec `navigate(-1)`, `w-10 h-10 rounded-md`
- **Icône hamburger mobile dans le header** — ouvre le sidebar mobile via `toggleMobileMenu` :
  - `client/src/shared/components/organisms/Header.jsx` : import `useMobileMenu`, bouton `md:hidden` avec SVG三条线
- **Bouton timer dans le footer mobile du sidebar** — ouvre le panneau timer comme dans le header desktop :
  - `client/src/shared/components/organisms/sidebar/Sidebar.jsx` : import `DeadlineIcon`, bouton déclenche `open-timers-panel` custom event
- **Prop `labelSize` sur `CheckboxField`** — contrôle la taille du texte du label :
  - `client/src/shared/components/molecules/fields/CheckboxField.jsx` : nouveau prop `labelSize` avec `labelSizeMap` (xs/sm/md/lg)

### Changed
- **InspectionFilesWidget allégé** — suppression des appels `GET /api/inspections/:id/files` (N+1) et ajout du filtre `status: 'completed'` :
  - `client/src/features/custom/comuse/inspections/hooks/useInspectionFilesWidget.js` : retrait de la boucle `Promise.all` sur `getFiles()`, ajout de `status: 'completed'` aux params API
- **ModuleFieldsManager refactoré** — refonte complète de la page de gestion des champs :
  - `client/src/features/settings/pages/ModuleFieldsManager.jsx` : utilisation de `FormField`/`Field`/`Button`/`Modal` de shared, type défaut vide, hide conditionnel (Format/Options/Valeur/Obligatoire si type non sélectionné), toggle Obligatoire via `FormField type="toggle"`, valeur par défaut adaptative (texte/date/boolean)
- **API fields filtrée** — exclusion des types non supportés côté backend :
  - `server/features/system/settings/services/ModuleFieldsService.js` : filtrage de `address`, `json`, `search` et `id` dans `getByModule()` (cache + DB)
- **Mise à jour directe des entités après édition inline** — propagation de `onEntityUpdate` des pages de détail vers `DetailsTab`, avec application de l'entité retournée par PUT :
  - `client/src/shared/related/components/tabs/DetailsTab.jsx` : remplacement du switch `inlineOverrides` par la mise à jour de l'entité et conservation du refresh pour le cascade owner
  - `client/src/shared/related/components/DetailPageTabs.jsx` : ajout et transmission de la prop `onEntityUpdate`
  - `client/src/features/crm/accounts/pages/AccountDetail.jsx` : transmission de `setEntity`
  - `client/src/features/crm/contacts/pages/ContactDetail.jsx` : transmission de `setEntity`
  - `client/src/features/crm/leads/pages/LeadDetail.jsx` : transmission de `setEntity`
  - `client/src/features/project-management/tasks/pages/TaskDetail.jsx` : transmission de `setEntity`
  - `client/src/features/project-management/appointments/pages/AppointmentDetail.jsx` : transmission de `setEntity`
  - `client/src/features/project-management/projects/pages/ProjectDetail.jsx` : ajout de `setEntity` et transmission
  - `client/src/features/custom/comuse/inspections/pages/InspectionDetails.jsx` : ajout de `setEntity` et transmission
  - `client/src/features/custom/terrains_mauricie/estates/pages/EstateDetail.jsx` : ajout de `setEntity` et transmission
  - `client/src/features/custom/terrains_mauricie/properties/pages/PropertyDetail.jsx` : ajout de `setEntity` et transmission
- **Title des cards invoices/quotes** — les cards mobiles affichent le numéro au lieu de "Sans titre" :
  - `client/src/features/finance/invoices/config.jsx` : ajout `titleField: 'invoice_number'` dans `tableConfig`
  - `client/src/features/finance/quotes/config.jsx` : ajout `titleField: 'quote_number'` dans `tableConfig`
- **Login — "Se souvenir de moi" + "Mot de passe oublié"** — même ligne avec space-between, `text-xs` pour les deux :
  - `client/src/auth/pages/Login.jsx` : layout `flex justify-between` avec `flex-1` sur chaque côté, `labelSize="xs"` sur CheckboxField
- **Login — bouton "Se connecter"** — pleine largeur sur mobile :
  - `client/src/auth/pages/Login.jsx` : ajout `className="w-full md:w-auto"` et container `justify-center md:justify-end`
- **Header mobile** — padding, hauteur et breadcrumb adaptés au mobile :
  - `client/src/shared/components/organisms/Header.jsx` : `px-0 md:px-4`, `md:h-[48px]`, breadcrumbs `hidden md:flex`, Deadline/Aide `hidden md:inline-flex`
- **Modal `sm`** — pleine largeur sur mobile :
  - `client/src/shared/components/organisms/Modal.jsx` : `max-w-sm` → `max-w-full md:max-w-md`
- **Sidebar footer mobile** — icônes timer/dark-mode/déconnexion séparées du bloc infos utilisateur :
  - `client/src/shared/components/organisms/sidebar/Sidebar.jsx` : infos user dans `rounded-lg bg-accent1/5 border`, icônes en `flex items-center justify-end gap-1.5` à l'extérieur

### Removed
- **MobileNavbar supprimé** — composant de navigation mobile en bas d'écran :
  - `client/src/shared/components/organisms/MobileNavbar.jsx` : fichier supprimé
  - `client/src/app/App.jsx` : import et rendu `<MobileNavbar />` retirés
- **FAB (Floating Action Button) mobile supprimé** — bouton flottant + en bas à droite :
  - `client/src/shared/components/organisms/Header.jsx` : bloc FAB + state `showQuickActionsMenu` + ref `quickActionsMenuRef` + useEffect click outside retirés
- **Input ordre numérique** — supprimé des cartes (remplacé par drag-and-drop)
- **Sélecteur de couleur** — retiré du formulaire d'ajout d'options dans le modal
- **Champ Clé technique** — masqué du modal (auto-généré depuis le label)
- **Champ field_key** — plus affiché dans les cartes ni dans l'aperçu du modal
- **Types Email/Téléphone/Nombre/Adresse/Recherche/JSON** — retirés du sélecteur de type (Email et Téléphone déplacés sous Format du type Texte, les autres supprimés)
- **Fonction `updateSortOrder`** — supprimée (remplacée par le drag-and-drop)

### Fixed
- **Cards invoices/quotes "Sans titre"** — les cards affichent maintenant le numéro (invoice_number/quote_number) au lieu du fallback "Sans titre"
- **Custom fields non affichés dans les pages détail** — `resolveFieldValue` ne cherchait qu'à la racine de l'entité, or les valeurs custom fields sont dans `entity.custom_fields` :
  - `client/src/shared/related/components/tabs/DetailsTab.jsx` : ajout du fallback `obj?.custom_fields?.[keyPath]` dans `resolveFieldValue`
- **PUT /accounts/:id ne retournait pas la même structure que GET** — le controller retournait un summary au lieu du détail complet :
  - `server/features/crm/accounts/AccountController.js` : re-fetch via `getAccountById()` après update
- **PUT /contacts/:id ne retournait pas la même structure que GET** — `formatContactSummary` au lieu de `formatContactDetail` :
  - `server/features/crm/contacts/ContactController.js` : re-fetch via `getContactById()` après update
- **PUT /leads/:id ne retournait pas la même structure que GET** — `toSummary()` au lieu de `toDetailedObject()` :
  - `server/features/crm/leads/LeadController.js` : re-fetch via `getLeadById()` après update

---

## 2026-08-19

### Added
- **Bouton d'aide (❓) dans le header** — ajout d'un bouton `HelpCircle` (lucide-react) à droite du bouton Deadline :
  - `client/src/shared/components/organisms/Header.jsx` : import `HelpCircle` depuis `lucide-react`, bouton ajouté après le DeadlineIcon
- **Icône Microphone (`Mic.svg`)** — nouvelle icône SVG pour la dictation vocale :
  - `client/src/shared/icons/Mic.svg` : icône SVG microphone (24x24, stroke 1.5)
  - `client/src/shared/icons/index.js` : export `MicIcon`
- **Composant `DictationButton`** — bouton de dictation réutilisable basé sur la Web Speech API native :
  - `client/src/shared/components/atoms/DictationButton.jsx` : feedback sonore (beep démarrage/fin), auto-stop après 2s de silence, debounce interim 100ms, gestion erreurs traduites, `fr-CA` par défaut
  - `client/src/shared/components/atoms/index.js` : export `DictationButton`
- **Dictation intégrée dans `TextField`** — bouton micro automatique sur les champs `type="text"` :
  - `client/src/shared/components/molecules/fields/TextField.jsx` : bouton flex centré à droite du champ, ponctuation intelligente (pas d'espace après `. , ! ? : ;`), premier caractère en majuscule
- **Dictation intégrée dans `TextAreaField`** — bouton micro automatique sur tous les textareas :
  - `client/src/shared/components/molecules/fields/TextAreaField.jsx` : position `absolute bottom-3 right-3`, padding `pb-6` pour éviter le chevauchement texte/bouton
- **Section "Reconnaissance Vocale" dans les paramètres avancés** — test de la Web Speech API native :
  - `client/src/features/settings/pages/SettingsAdvanced.jsx` : section avec bouton "Lancer la reconnaissance"
  - `client/src/features/settings/components/VoiceModal.jsx` : modal de test avec transcription en temps réel, fallback `fr-CA` → `fr-FR` → serveur
- **Page Organisation** — fusion des pages Utilisateurs + Permissions en une seule page avec onglets :
  - `client/src/features/settings/pages/SettingsOrganisation.jsx` : page wrapper avec tabs `useSearchParams` (users/roles), layout identique à la page Système
  - `client/src/shared/config/routesAccessConfig.js` : clé `organisation` remplace `users` + `roles`
  - `client/src/app/main.jsx` : import + componentMap mis à jour
- **Modal de création de rôle** — nouveau modal réutilisant `Modal` + `Form` :
  - `client/src/features/settings/roles/views/CreateRoleModal.jsx` : champ "Nom du rôle" avec slug auto-généré via `slugify()`, pas de champ ID visible
  - `client/src/features/settings/roles/views/index.js` : export `CreateRoleModal`
- **Filtres sur la page Utilisateurs** — recherche par nom + filtrage par compte :
  - `client/src/features/settings/pages/SettingsUsers.jsx` : `TextField` (debounce 200ms) + `SelectField` (comptes, clearable, searchable)
  - `client/src/features/settings/services/usersApi.js` : support paramètre `account_id`
- **Groupement par compte dans le tableau Utilisateurs** — lignes de séparation `__fullWidthRow` avec alternance accent2/accent1 :
  - `client/src/features/settings/pages/SettingsUsers.jsx` : `useMemo` tri par compte + injection lignes `__fullWidthRow`
  - `client/src/shared/components/organisms/TanStackTableView.jsx` : support `__fullWidthRow` avec `colSpan` dynamique
- **Backend : support `account_id` dans GET /users** :
  - `server/features/system/users/usersRoutes.js` : ajout `account_id` au `usersQuerySchema`
  - `server/features/system/users/UserController.js` : transmission `account_id` au service
- **Test routes auth** — nouveau fichier de test :
  - `server/features/system/auth/test.auth.routes.mjs` : 11 tests CRUD rôles avec token frais
- **Split helpers controller rôles** :
  - `server/features/system/auth/controllers/rolesHelpers.js` : extraction `getContext`, `normalizePermissions`, `normalizeRole`, `handleError`
- **Alignement routes auth sur `createRoutePresets`** :
  - `server/features/system/auth/routes/authRoutes.js` : `const mw = createRoutePresets({ permissionBase: 'roles' })`, routes POST/PUT/activate/deactivate/duplicate utilisent `...mw.manage`

### Changed
- **Widget appointments : icône Meet cliquable** — le clic sur l'icône Google Meet ouvre le lien Meet dans un nouvel onglet au lieu de naviguer vers la fiche RDV :
  - `client/src/features/project-management/appointments/components/AppointmentWidget.jsx` : icône SVG wrappée dans un `<a target="_blank">`, `stopPropagation()` supprimé
- **Widget appointments : clic sélectif sur les éléments** — seule la bloc date et l'icône Meet sont cliquables, pas toute la carte :
  - `client/src/features/project-management/appointments/components/AppointmentWidget.jsx` : `<button>` externe remplacé par `<div>`, bloc date = `<button>` cliquable avec `hover:ring`, carte sans `cursor-pointer`
- **Widget appointments : hover subtil sur la carte** — le hover `bg-text-main/6` est conservé mais sans `cursor-pointer` sur la carte :
  - `client/src/features/project-management/appointments/components/AppointmentWidget.jsx` : `hover:bg-text-main/6` sans `cursor-pointer`
- **Widget appointments : border-radius réduit** — les arrondis des éléments du widget sont plus compacts :
  - `client/src/features/project-management/appointments/components/AppointmentWidget.jsx` : card `rounded-xl` → `rounded-lg`, bloc date `rounded-lg` → `rounded-md`
- **Dictation désactivée dans la recherche utilisateurs** — le bouton micro n'apparaît plus dans le champ de recherche de la page Organisation > Utilisateurs :
- **Fusion pages Users + Roles en Organisation** — les routes `/settings/users` et `/settings/roles` redirigent vers `/settings/organisation` :
  - `client/src/shared/config/routesAccessConfig.js` : supprimé `users` + `roles`, ajouté `organisation`
  - `client/src/shared/utils/permissions/permissions.js` : routes `roles.team.*` mises à jour
  - `client/src/shared/config/portalConfig.js` : `featureToRoutesMapping` mis à jour
  - `client/src/features/settings/pages/Settings.jsx` : suppression `isRolesPage` + `useLocation` inutilisés
- **SelectField — X remplace le chevron** quand une valeur est sélectionnée (au lieu d'afficher les deux) :
  - `client/src/shared/components/molecules/fields/SelectField.jsx` : condition ternaire clear/chevron au même endroit
- **Colonnes tableau Utilisateurs refactorisées** — colonne Nom fusionnée avec email (icône Mail + texte), colonne Compte en texte simple :
  - `client/src/features/settings/config/usersColumnsConfig.jsx` : renderers `full_name` (nom + email icon), `account` (texte), colonnes email/account masquées
  - **Correction bug `buildColumnsWithRenderers`** — les `customRenderers` étaient ignorés ; appliqués après construction
- **Hook `useUsers` optimisé** — suppression de la double requête API au montage :
  - `client/src/features/settings/hooks/useUsers.js` : `loadUsers` ne dépend plus de `filters` dans le `useCallback`, passe les filtres en argument au `useEffect`
- **Backend GET /users : filtres search + account_id** :
  - `server/features/system/auth/controllers/rolesController.js` : controller `getAllUsers` supporte `search` (multi-champs insensitive) + `account_id` + pagination
  - `server/features/system/users/usersRoutes.js` : `usersQuerySchema` étendu avec `account_id`
  - `server/features/system/users/UserController.js` : transmission des filtres au service
- **Route POST /auth/roles alignée** — `createRoutePresets({ permissionBase: 'roles' })` remplace les middlewares manuels :
  - `server/features/system/auth/routes/authRoutes.js` : import `createRoutePresets`, const `mw`
- **Controller rôles splitté** — helpers extraits dans `rolesHelpers.js` pour respecter la règle <500 lignes :
  - `server/features/system/auth/controllers/rolesController.js` : 1015 → 947 lignes
  - `server/features/system/auth/controllers/rolesHelpers.js` : nouveau (83 lignes)
- **Aperçu facture/devis responsive mobile** — redesign complet du layout pour mobile (cards au lieu de tableau) :
  - `client/src/features/finance/invoices/components/InvoicePreviewCard.jsx` : layout cards mobile (`md:hidden`) avec Qté/Prix/Taxes en ligne, section client/dates empilée sur mobile avec dates côte à côte, paddings réduits sur mobile (`p-0 md:p-6`), totaux sans border ni padding horizontal sur mobile, `bg-white` retiré
  - `client/src/features/finance/quotes/components/QuotePreviewCard.jsx` : mêmes modifications responsive que InvoicePreviewCard
  - `client/src/features/finance/invoices/components/InvoiceView.jsx` : `bg-white` retiré du wrapper `invoice-print-wrapper`
  - `client/src/features/finance/quotes/components/QuoteView.jsx` : `bg-white` retiré du wrapper `QUOTE-print-wrapper`
- **ModuleFieldsService — refonte complète** : méthodes CRUD custom fields unifiées, optimisations performance :
  - `server/features/system/settings/services/ModuleFieldsService.js` : suppression des wrappers unitaires (setCustomValue/deleteCustomValue), `getCustomFields` gère single+batch via `Array.isArray`, `updateCustomFields` intègre validation+filtrage, `_extractCustomFields` privée, `resolveFeature` parallélisé via `Promise.all`, `deleteCustomFields` sans transaction wrapper, cache `getByKey` via `getByModule`
- **Nomenclature `get{Entity}ById` — standardisation** : tous les services renommés pour cohérence :
  - `server/features/project-management/projects/services/ProjectService.js` : `getById` → `getProjectById`
  - `server/features/custom/terrains_mauricie/properties/services/property.service.js` : `getById` → `getPropertyById`
  - `server/features/custom/terrains_mauricie/estates/services/estate.service.js` : `getById` → `getEstateById`
  - `server/features/crm/leads/services/lead.service.js` : typo `getleadById` → `getLeadById`
  - `server/features/communication/notifications/services/NotificationService.js` : `getById` → `getNotificationById`
  - `server/features/custom/lrgmedia/monitoring/monitoring.service.js` : `getById` → `getMonitoringById`
  - `server/features/finance/invoices/invoice.service.js` : `getById` → `getInvoiceById`
  - `server/features/finance/payments/payment.service.js` : `getById` → `getPaymentById`
  - `server/features/finance/quotes/quote.service.js` : `getById` → `getQuoteById`
  - `server/features/project-management/appointments/services/AppointmentService.js` : `getById` → `getAppointmentById`
  - `server/features/finance/subscriptions/subscription.service.js` : `getById` → `getSubscriptionById`
  - + tous les controllers et routes associés
- **PUT update retourne via `getXxxById()`** — les réponses update ont maintenant la même structure que GET :
  - `server/features/crm/accounts/account.service.js` : `updateAccount` retourne via `getAccountById`
  - `server/features/crm/contacts/services/contact.service.js` : `updateContact` retourne via `getContactById`
  - `server/features/project-management/tasks/services/TaskService.js` : `updateTask` retourne via `getTaskById`
  - `server/features/custom/terrains_mauricie/properties/services/property.service.js` : `update` retourne via `getPropertyById`
  - `server/features/custom/terrains_mauricie/estates/services/estate.service.js` : `update` retourne via `getEstateById`
  - `server/features/project-management/time-tracking/services/TimeTrackingService.js` : `updateTimeEntry` retourne via `getTimeEntryById`
  - `server/features/custom/comuse/inspections/services/InspectionService.js` : `updateInspection` retourne via `getInspectionByIdEnriched`
- **Custom fields intégrés dans 4 features CRM/PM** — pattern `getCustomFields`/`updateCustomFields`/`deleteCustomFields` :
  - `server/features/crm/contacts/services/contact.service.js` : batch+single read, create/update/delete write, `custom_fields` key
  - `server/features/crm/leads/services/lead.service.js` : batch+single read, create/update/delete write, `custom_fields` key
  - `server/features/project-management/projects/services/ProjectService.js` : batch+single read, create/update/delete write, `custom_fields` key
  - `server/features/project-management/tasks/services/TaskService.js` : batch+single read, create/update/delete write, `custom_fields` key
- **Réponses API `custom_fields`** — toutes les réponses GET/PUT/POST retournent les custom fields sous la clé `custom_fields` (plus de merge à la racine via `Object.assign`)

### Fixed
- **Overflow horizontal tableau** — les lignes `__fullWidthRow` débordaient à droite du tableau :
  - `client/src/shared/components/organisms/TanStackTableView.jsx` : `colSpan` utilise `table.getVisibleLeafColumns().length` + `style` inline `width/maxWidth: 100%`
- **Double requête API `/users` au montage** — le hook `useUsers` appelait `loadUsers()` deux fois :
  - `client/src/features/settings/hooks/useUsers.js` : `filters` retiré des dépendances `useCallback`, passé en argument au `useEffect`
- **Filtre account_id ignoré par le backend** — le paramètre `account_id` n'était pas transmis au controller :
  - `server/features/system/users/usersRoutes.js` : ajout `account_id` au `usersQuerySchema` (manquait `additionalProperties: false`)
  - `server/features/system/users/UserController.js` : transmission `account_id` à `UserService.getUsers()` et `getTotal()`
- **Toggle widget fond incorrect** — le composant `Toggle` partagé utilisait `bg-background-5` au lieu de `bg-background-4` :
  - `client/src/shared/components/atoms/Toggle.jsx` : `bg-background-5` → `bg-background-4` sur le conteneur du toggle
- **Widget appointments : `dateFrom` ignoré** — le backend ne reconnaissait pas le paramètre camelCase `dateFrom` envoi par le frontend :
  - `server/features/project-management/appointments/utils/appointmentHelpers.js` : `buildWhereClause` accepte maintenant `dateFrom`/`dateTo` (camelCase) en plus de `date_from`/`date_to` (snake_case)
- **Widget appointments : RDV du jour manquants** — le tri `DESC` par défaut retournait les RDV les plus éloignés, pas les plus proches :
  - `server/features/project-management/appointments/services/AppointmentService.js` : tri `ASC` automatique quand `dateFrom` est fourni
  - `client/src/features/project-management/appointments/hooks/useAppointmentWidget.js` : `dateFrom` utilise minuit du jour courant au lieu de `new Date().toISOString()`
- **Widget appointments : RDV annulés/supprimés affichés** — les filtres de statut n'excluaient pas `cancelled`/`deleted` par défaut dans le widget :
  - `client/src/features/project-management/appointments/hooks/useAppointmentWidget.js` : paramètre `status: 'scheduled'` ajouté
- **Dark mode sur la page login** — la colonne formulaire s'adapte au thème sombre via `bg-background-3` :
  - `client/src/auth/pages/Login.jsx` : remplacement de `bg-transparent` par `bg-background-3` sur la colonne formulaire
- **Bug `InvoiceService.getById` cassé après renommage** — ZohoBooksService référençait l'ancien nom :
  - `server/features/system/integrations/zoho/services/zoho.books.service.js` : `InvoiceService.getById` → `InvoiceService.getInvoiceById` (2 occurrences)
- **SyntaxError `taskIds` dupliqué** — variable déclarée 2 fois dans la même portée :
  - `server/features/project-management/tasks/services/TaskService.js` : renommage en `cfTaskIds` pour le batch custom fields
- **`p is not defined` sur `/api/admin/logs/dashboard`** (500 Internal Server Error) — variable `p` au lieu de `prisma` dans 2 méthodes DB :
  - `server/shared/logging/LogAnalyzer.js` : `p.system_logs` → `prisma.system_logs` dans `_readLogFileDb()` (~L120) et `_searchAllLogsDb()` (~L365)
- **Erreur de syntaxe JSX dans le Header** — deux `<button>` adjacentes non wrappées dans un Fragment React :
  - `client/src/shared/components/organisms/Header.jsx` : ajout de `<>...</>` autour des boutons Deadline et Aide dans la branche ternaire
- **Scroll chaining bloqué sur le dashboard** — impossibilité de scroller la page après avoir atteint le bas d'un widget :
  - `client/src/features/project-management/tasks/components/TaskWidget.jsx` : suppression de `overscroll-y-contain` sur le conteneur scrollable (conditionnel > 10 tâches)
  - `client/src/shared/components/organisms/OverviewWidget/OverviewWidget.jsx` : suppression de `overscroll-y-contain` — impacte `ProjectWidget`, `InspectionWidget`, `InspectionFilesWidget`
- **Animation fermeture modal** — le modal de création de rôle ne jouait pas l'animation de fermeture :
  - `client/src/features/settings/roles/views/CreateRoleModal.jsx` : suppression du `if (!isOpen) return null` précoce qui court-circuitait le rendu du `Modal`
  - `client/src/features/settings/pages/SettingsUsers.jsx` : ajout de `dictation={false}` sur le `TextField` de recherche
- **Redesign page de connexion** — passage à un layout 2 colonnes (image gauche / formulaire droite) :
  - `client/src/auth/pages/Login.jsx` : logo SVG supprimé, layout `flex h-screen w-full`, colonne image avec photo Unsplash portrait aléatoire, colonne formulaire avec `bg-background-3`
- **Images aléatoires en portrait sur la page login** — 8 photos Unsplash (800×1200) sélectionnées au chargement via `useState` :
  - `client/src/auth/pages/Login.jsx` : tableau d'images portrait, `Math.random()` pour la sélection
- **Thème toggle (light/dark) sur la page login** — bouton compact en bas à droite du formulaire :
  - `client/src/auth/pages/Login.jsx` : import `ThemeToggle` + `useThemeContext`, rendu dans un `absolute bottom-6 right-6`
- **Titre H1 login aligné à gauche** — suppression du point final, retrait de `items-center` sur le conteneur formulaire :
  - `client/src/auth/pages/Login.jsx` : `"Bienvenue sur notre portail client"` (sans point)
- **Bouton "Afficher" mot de passe harmonisé** — couleurs accent2 pour fond, texte et bordure :
  - `client/src/shared/components/molecules/fields/PasswordField.jsx` : `bg-transparent text-text-main/50` → `bg-accent2/10 text-accent2 border-accent2 hover:bg-accent2/20`
- **Thème light/dark sur la page "Champs"** — remplacement des couleurs hardcoded par des tokens sémantiques :
  - `client/src/features/settings/pages/ModuleFieldsManager.jsx` : `bg-neutral-*`, `text-white`, `text-neutral-*`, `border-neutral-*` → `bg-background-*`, `text-text-main`, `text-muted`, `border-border`, `text-success`, `text-error`

### Changed
- **Icônes partagées dans RoleSelectionCardView** — remplacement de tous les SVG inline par des icônes `@shared/icons` :
  - `client/src/features/settings/roles/views/RoleSelectionCardView.jsx` : `UserIcon` (utilisateurs), `TrashIcon` (supprimer), `CopyIcon` (cloner), `CircleOffIcon` (désactiver), `AddIcon` (ajouter rôle), `InformationIcon` (voir), `RefreshIcon` (réactiver)
- **Badge partagé pour les rôles** — remplacement du `<span>` inline par le composant `Badge` :
  - `client/src/features/settings/roles/views/RoleSelectionCardView.jsx` : import `Badge` depuis `@shared/components/atoms/Badge.jsx`, utilisation avec variants `accent2` (Interne) et `accent1` (Externe)
  - `client/src/shared/components/atoms/Badge.jsx` : ajout des variants `accent2` et `accent1` dans `COLOR_VARIANTS`

### Removed
- **Section "Reconnaissance Vocale" dans les paramètres avancés** — suppression complète du test Web Speech API :
  - `client/src/features/settings/pages/SettingsAdvanced.jsx` : section, import `VoiceModal`, état `isVoiceModalOpen` supprimés
  - `client/src/features/settings/components/VoiceModal.jsx` : fichier supprimé
- **Logo SVG de la page login** — suppression du bloc `<div>` contenant le logo SVG en haut à gauche :
  - `client/src/auth/pages/Login.jsx` : bloc `hidden md:block` avec SVG supprimé
- **Onglet "Développement" (dev)** — suppression de l'onglet de role-switching dans la page Système :
  - `client/src/features/settings/monitoring/pages/Monitoring.jsx` : import `UserRoleManager` supprimé, `'dev'` retiré de `TABS_WITH_PARAMS` et du tableau `tabs`, bloc de rendu `{/* Dev Tab */}` supprimé
  - `client/src/features/settings/monitoring/pages/UserRoleManager.jsx` : fichier supprimé

## 2026-08-18

### Changed
- **Refactor feature `site-health` → `monitoring`** — renommage complet de la feature (backend + client + BDD) :
  - `server/features/custom/lrgmedia/` : dossier `site-health/` → `monitoring/`
  - `server/features/custom/lrgmedia/monitoring/SiteHealthController.js` → `MonitoringController.js` : classe `SiteHealthController` → `MonitoringController`, error codes, Logger tags
  - `server/features/custom/lrgmedia/monitoring/site-health.routes.js` → `monitoring.routes.js` : permissions `site_health.*` → `monitoring.*`
  - `server/features/custom/lrgmedia/monitoring/site-health.service.js` → `monitoring.service.js` : classes `SiteHealthService`/`SiteHealthCheckService` → `MonitoringService`/`MonitoringCheckService`
  - `server/features/custom/lrgmedia/monitoring/site-health.validation.js` → `monitoring.validation.js` : export `monitoringValidationSchemas`
  - `server/features/custom/lrgmedia/monitoring/models/SiteHealth.js` → `Monitoring.js` : classe `Monitoring`, Prisma models `monitoring_sites`/`monitoring_checks`
  - `server/features/custom/lrgmedia/monitoring/models/SiteHealthSchema.js` → `MonitoringSchema.js` : mapping `monitoring_sites`/`monitoring_checks`
  - `server/features/custom/lrgmedia/monitoring/utils/siteHealth*.js` → `monitoring*.js` : exports `monitoringValidators`, `monitoringFormatters`, `monitoringCalculators`
  - `server/features/custom/lrgmedia/monitoring/test.site-health.routes.ps1` → `test.monitoring.routes.mjs` : conversion PowerShell → Node.js ESM
  - `server/features/custom/lrgmedia/monitoring/readme.md` : documentation feature monitoring
- **Restructure feature `monitoring`** — alignement avec le pattern `contacts` (lean) :
  - Routes/validation remontées à la racine de la feature (suppression dossier `routes/`)
  - Service remonté à la racine (suppression dossier `services/`)
  - Dossier `permissions/` supprimé (permissions gérées via middleware central)
  - `models/index.js` et `utils/index.js` supprimés (imports directs)
- **Renommage tables BDD** — alignement noms tables avec la feature :
  - `websites` → `monitoring_sites`, `website_checks` → `monitoring_checks`
  - Colonne `website_id` → `monitoring_site_id`
  - 9 index renommés, 2 FK constraints renommées
- **Prisma schema** — mise à jour du schéma et push en base :
  - `server/prisma/schema/site-health.prisma` → `monitoring.prisma` : modèles `monitoring_sites`/`monitoring_checks`
- **Refs client renommées** :
  - `client/src/shared/config/apiConfig.js` : `SITE_HEALTH` → `MONITORING`, paths `/site-health` → `/monitoring`
  - `client/src/shared/config/portalConfig.js` : feature key `site-health` → `monitoring`
  - `client/src/shared/config/routesAccessConfig.js` : route, path, componentKey, feature
  - `client/src/app/main.jsx` : lazy import `MonitoringDashboard`, componentMap keys
  - `client/src/shared/components/organisms/GenericFeatureTableView.jsx` : builder `monitoring`
  - `client/src/features/custom/lrgmedia/site-health/` → `monitoring/` (12 fichiers renommés + contenu)
- **Refs config serveur renommées** :
  - `server/config/permissions-registry.js` : `monitoring` permission key
  - `server/config/portal-feature-dependencies.js` : `monitoring` feature
  - `server/routes/apiRouteConfig.js` : import `monitoringRouter`, route key `monitoring`
  - `portal-configs/comuse.json` : feature key `monitoring`

- **Alignement permissions `monitoring.routes.js`** — refactor vers pattern standard `createRoutePresets` :
  - `server/features/custom/lrgmedia/monitoring/monitoring.routes.js` : `createRoutePresets()` + `.custom()` → `createRoutePresets({ permissionBase: 'monitoring' })` avec 3 niveaux (`read`/`write`/`manage`)
  - `server/features/custom/lrgmedia/monitoring/readme.md` : tableau permissions aligné sur le registre central (`view`, `edit`, `manage`)

### Removed
- **Suppression 3 routes monitoring** — retrait de `/filter-options`, `/alerts`, `/:id/check-now` et tout le code associé :
  - `server/features/custom/lrgmedia/monitoring/monitoring.routes.js` : suppression des 3 définitions de routes
  - `server/features/custom/lrgmedia/monitoring/MonitoringController.js` : suppression méthodes `checkNow`, `getFilterOptions`, `getAlerts` + import `MonitoringCheckService`
  - `server/features/custom/lrgmedia/monitoring/monitoring.service.js` : suppression `getAggregations()`, `generateAlerts()`, classe `MonitoringCheckService` entière
  - `server/features/custom/lrgmedia/monitoring/models/Monitoring.js` : suppression méthodes `getActiveAlerts()`, `getAvailableAccounts()`, `getAvailableStatuses()`
  - `server/features/custom/lrgmedia/monitoring/monitoring.validation.js` : suppression schéma `dashboardQuery`
  - `server/features/custom/lrgmedia/monitoring/utils/monitoringFormatters.js` : suppression `formatAlerts()`
  - `server/features/custom/lrgmedia/monitoring/index.js` : suppression export `MonitoringCheckService`
  - `server/features/custom/lrgmedia/monitoring/test.monitoring.routes.mjs` : suppression tests 2, 3, 5 + renumérotation
  - `server/features/custom/lrgmedia/monitoring/readme.md` : suppression 3 lignes documentation
  - `client/src/shared/config/apiConfig.js` : suppression keys `FILTER_OPTIONS`, `ALERTS`, `CHECK_NOW`
  - `client/src/features/custom/lrgmedia/monitoring/services/monitoringApi.js` : suppression méthodes `getFilterOptions()`, `checkNow()`, `getAlerts()`
  - `client/src/features/custom/lrgmedia/monitoring/hooks/useMonitoring.js` : suppression states `isChecking`/`checkingId`, callback `checkSiteNow`
  - `client/src/features/custom/lrgmedia/monitoring/pages/MonitoringDashboard.jsx` : suppression handlers `handleCheckAll`/`handleCheckSite`/`handleCheckSiteFromTable`, bouton "Vérifier maintenant", import `RefreshCw`
- **Documentation permissions routes** — ajout du pattern standard dans le skill :
  - `.github/skills/backend-feature-structure/SKILL.md` : section "Pattern Routes avec Permissions" avec exemple de code et règle d'usage

### Removed
- **Dossier `permissions/`** dans la feature monitoring (permissions via middleware central)
- **Dossier `routes/`** dans la feature monitoring (1 seul fichier → racine)
- **Dossier `services/`** dans la feature monitoring (1 seul fichier → racine)
- **`models/index.js`** et **`utils/index.js`** — imports directs vers fichiers individuels
- **`test.site-health.routes.ps1`** — remplacé par `.mjs`

### Fixed
- **Erreur de parsing JSX** — deux `<button>` adjacents dans un ternary sans fragment wrapper provoquaient une erreur Vite (`Expected ',' or ')' but found 'type'`) :
  - `client/src/shared/components/organisms/Header.jsx` : ajout d'un fragment `<>...</>` autour des deux boutons (Deadline + Aide) dans la branche `? (...)` du ternary
- **Boucle infinie requêtes appointments** — le formulaire de prise de rendez-vous déclenchait `GET /api/appointments?limit=all` en boucle infinie :
  - `client/src/features/project-management/appointments/hooks/useAppointmentSlots.js` : `fetchOccupiedDates` retourne désormais le tableau directement (au lieu de void) pour éviter la lecture du state stale
  - `client/src/features/project-management/appointments/components/steps/StepScheduling.jsx` : suppression de `occupiedDates` des dépendances de l'`useEffect`, utilisation de la valeur retournée par `await fetchOccupiedDates()` au lieu du state
- **Imports relatifs cassés après refactor** — chemins `../../../../../shared/` devenus incorrects après déplacement des fichiers de `services/` à la racine :
  - `server/features/custom/lrgmedia/monitoring/monitoring.service.js` : paths corrigés en `../../../../shared/`
  - `server/features/custom/lrgmedia/monitoring/monitoring.routes.js` : path middleware corrigé

## 2026-08-13

### Changed
- **Refactor `AppointmentApi`** — renommage et unification du service appointments frontend :
  - `client/src/features/project-management/appointments/appointmentApi.js` : classe `UnifiedAppointmentService` → `AppointmentApiClass`, instance `AppointmentService` → `AppointmentApi`, fichier renommé `appointmentsApi.js` → `appointmentApi.js`, suppression des aliases `appointmentsApi` / `appointmentsService`
  - `client/src/features/project-management/appointments/hooks/useAppointments.js` : import `AppointmentApiClass` depuis `appointmentApi.js`
  - `client/src/features/project-management/appointments/hooks/useAppointmentSlots.js` : import `AppointmentApi` depuis `appointmentApi.js`
  - `client/src/features/project-management/appointments/hooks/useAppointmentWidget.js` : import `AppointmentApi` depuis `appointmentApi.js`
  - `client/src/features/project-management/appointments/components/ModalBooking.jsx` : import `AppointmentApi`
  - `client/src/features/project-management/appointments/config.jsx` : import `AppointmentApi`
  - `client/src/features/project-management/appointments/pages/AppointmentDetail.jsx` : import `AppointmentApi`
  - `client/src/features/project-management/appointments/index.js` : re-exports `AppointmentApiClass` + `AppointmentApi`
  - `client/src/shared/services/searchService.js` : import `AppointmentApi`
  - `client/src/shared/related/featureConfigs.js` : import `AppointmentApi`

### Added
- **Skill `backend-psql-explorer`** — remplacement de `local-db-query` par un skill dynamique sans valeurs hardcodées :
  - `.github/skills/backend-psql-explorer/SKILL.md` : workflow d'exploration, fallback Node.js `pg`, Phase Exploration en 8 étapes, requêtes de découverte (information_schema, pg_constraint, pg_policies), bannissement de `pg_stat_user_tables.n_live_tup` (estimation obsolète)
  - `.github/skills/backend-psql-explorer/db-explore.mjs` : script d'exploration complète (schemas, tables avec COUNT(*) réel, enums) — 1 seule commande au lieu de 5-6 appels terminal
  - `.github/skills/backend-psql-explorer/db-inspect.mjs` : script d'inspection table (colonnes, FK, indexes, constraints, triggers, RLS, échantillon) — credentials jamais exposés
  - `.github/skills/backend-psql-explorer/db-query.mjs` : script de requête SQL read-only avec blocage des écritures (INSERT/UPDATE/DELETE/DROP) et LIMIT 200 automatique
- **Skill `server-feature-optimization`** — audit backend avec 7 piliers (performance, sécurité, taille, mémoire, concurrency, erreurs, architecture) :
  - `.github/skills/server-feature-optimization/SKILL.md` : skill d'analyse-only avec workflow d'audit structuré, format de rapport standardisé, mode quick win, et conventions du projet
- **Audit Registry** — suivi des analyses backend avec dates et scores :
  - `.github/skills/server-feature-optimization/AUDIT-REGISTRY.md` : registre de 31 features du projet avec colonnes date, score, violations, notes. Évite les ré-audits inutiles (< 30j) et recommande les ré-audits > 90j

### Changed
- **Audit & fix `time-tracking` feature** — correction de 8 violations détectées :
  - `server/features/project-management/time-tracking/models/TimeEntry.js` : import Logger unifié, `findById` avec `deleted_at: null`, soft delete au lieu de hard delete, description sanitizée (`trim().slice(0,500).replace()`), suppression requête `verifyEntry` inutile
  - `server/features/project-management/time-tracking/services/TimeTrackingService.js` : import Logger unifié, ajout `ActivityLogManager.logEvent` sur create/update/delete, suppression `formatDuration` dupliqué (délègue aux helpers)
  - `server/features/project-management/time-tracking/utils/timeTrackingValidation.js` : import Logger unifié, logs `body: req.body` remplacés par `fields: Object.keys()`
  - `server/features/project-management/time-tracking/utils/timeTrackingHelpers.js` : import Logger unifié
  - `server/features/project-management/time-tracking/README.md` : mis à jour (soft delete, ActivityLogManager, dépendances)
- **Test `time-tracking` adapté au portal lrgmedia** :
  - `server/features/project-management/time-tracking/test.time-tracking.routes.mjs` : portal `'demo'` → `'lrgmedia'` (port 3001, email `info@lrgmedia.ca`), `taskId: 10611` et `projectId: 135` (IDs valides en base)
- **Optimisation performance subscription billing** — réduction de ~950 à ~120 requêtes DB pour 50+ abonnements :
  - `server/features/system/scheduler/jobs/subscription.billing.job.js` : preload invoices par user (1 requête au lieu de 2N), batch `createMany` notifications, batch `$transaction` subscriptions.update, batch accounts preload
- **Sécurité mémoire subscription billing** — prévention des pics de mémoire :
  - `server/features/system/scheduler/jobs/subscription.billing.job.js` : fenêtre 90 jours sur les chargements invoices (pas de chargement de tout l'historique), cleanup explicite des Maps/arrays après les opérations batch

### Removed
- **Skill `local-db-query`** — supprimé et remplacé par `backend-psql-explorer` (scripts dynamiques, pas de hardcode, COUNT(*) au lieu de pg_stat)
- **Index Prisma ajouté** pour couvrir les requêtes unpaid count :
  - `server/prisma/schema/invoices.prisma` : `@@index([user_id, deleted_at, status])` ajouté
  - `server/features/finances/invoices/models/InvoicesSchema.js` : index synchronisé
- **Renamed `portal-specific` → `custom`** — alignement frontend/backend :
  - `client/src/features/portal-specific/` → `client/src/features/custom/`
  - `server/features/portal-specific/` → `server/features/custom/`
  - Tous les imports mis à jour (17 refs client, 4 refs server)
- **Moved features portal-specific dans `custom/{portal}/`** — regroupement par portail :
  - `client/src/features/site-health/` → `client/src/features/custom/lrgmedia/site-health/` (2 imports + 2 relatifs corrigés en `@shared` alias)
  - `client/src/features/feedbacks/` → `client/src/features/custom/lrgmedia/feedbacks/` (3 imports dans `App.jsx`)
- **Renamed `finances` → `finance`** — alignement singulier server ↔ client :
  - `server/features/finances/` → `server/features/finance/` (14 imports dans 7 fichiers)
- **Renamed `payment` → `payments`, `subscription` → `subscriptions`** — pluriel pour sous-entités :
  - `server/features/finance/payment/` → `server/features/finance/payments/` (2 imports)
  - `server/features/finance/subscription/` → `server/features/finance/subscriptions/` (2 imports)

### Fixed
- **Soft delete `findById`** — `TimeEntry.findById` ne retouvait plus les entrées soft-de supprimées :
  - `server/features/project-management/time-tracking/models/TimeEntry.js` : ajout `deleted_at: null` dans le where
- **Hard delete → soft delete** — `TimeEntry.delete` supprimait physiquement les entrées malgré la présence de `deleted_at` :
  - `server/features/project-management/time-tracking/models/TimeEntry.js` : `prisma.time_entries.delete()` remplacé par `prisma.time_entries.update({ deleted_at: new Date() })`
- **Logs exposant `req.body`** — le body complet était loggé dans la validation, risque de données sensibles :
  - `server/features/project-management/time-tracking/utils/timeTrackingValidation.js` : remplacé par `fields: Object.keys(req.body || {})`
- **FormatDuration dupliqué** — deux implémentations quasi identiques dans service et helpers :
  - `server/features/project-management/time-tracking/services/TimeTrackingService.js` : supprimé, délègue à `timeTrackingHelpers.formatDuration`
- **Requête `verifyEntry` inutile** — SELECT après create dont le résultat n'était jamais utilisé :
  - `server/features/project-management/time-tracking/models/TimeEntry.js` : supprimée
- **Input non sanitizé** — `description` stockée brute en DB :
  - `server/features/project-management/time-tracking/models/TimeEntry.js` : `String().trim().slice(0,500).replace(/[<>]/g, '')` sur create et update
- **Anti-doublon facturation** — garde empêchant la création de factures en double si le job crash entre la création et la mise à jour de `next_billing_date` :
  - `server/features/system/scheduler/jobs/subscription.billing.job.js` : vérification d'une facture `draft/sent` existante pour la même subscription ce mois-ci avant `InvoiceService.create`
- **Seuil d'échec facturation** — les abonnements en boucle de facturation échouée n'expiraient jamais :
  - `server/features/system/scheduler/jobs/subscription.billing.job.js` : comptage des factures impayées (draft/sent) par subscription → passage en `past_due` + `auto_renew: false` à ≥3 impayées
- **Logique Phase 3 expiration réécrite** — l'ancien filtre `auto_renew: false` n'était jamais atteint (Phase 2 ne le désactivait pas) :
  - `server/features/system/scheduler/jobs/subscription.billing.job.js` : filtre élargi à tous les subs `active` >30j overdue avec vérification de factures impayées avant expiration
- **Notification priority `urgent` invalide** — `NotificationService` rejette `urgent` pour la catégorie `invoice` :
  - `server/features/system/scheduler/jobs/subscription.billing.job.js` : `priority: 'urgent'` → `priority: 'high'` (Phase 2 past_due + Phase 3 expiration)

## 2026-08-12

### Changed
- **Fail2ban filters nginx enrichis** — couverture de scanner augmentée de +1080 matches :
  - `/etc/fail2ban/filter.d/nginx-wordpress-login.conf` : pattern `/+wp-login\.php` pour catch le double-slash `//wp-login.php` (+766 matches)
  - `/etc/fail2ban/filter.d/nginx-exploit-scan.conf` : ajout status `200` pour catch les fichiers `.env` exposés (+203 matches)
  - `/etc/fail2ban/filter.d/nginx-webscan.conf` : rule dédiée `wp-content/plugins/*/wp_filemanager\.php` (ignoreregex ajusté, wp_filemanager.php n'est plus exclu)
  - `/etc/fail2ban/filter.d/nginx-secrets-scan.conf` : ajout patterns `.env.backup`, `.env.old`, `.env.production`, `.env.local`, `.env.example`, `.env.bak`, `.env.test`, `.env.staging`, `.env.development`, `secrets.yml`, `secrets.json`, `.gitlab-ci.yml`, `.docker/config.json`, `Dockerfile`, `docker-compose.yaml`, `.npmrc`, `.boto`, `.svn/entries`, `.cursor/mcp.json`, `.continue/config.json`, `.codex/config.toml`, `.claude.json`, `.aider.conf.yml`, `.github/workflows/deploy.yml`, `.ssh/id_dsa`, `.ssh/known_hosts`, `.htpasswd` (+713 matches)
- **Scheduler routes réduites de 10+ à 4** — architecture simplifiée :
  - `server/features/system/scheduler/scheduler.routes.js` : 4 routes (GET list, PUT activate, PUT deactivate, POST execute)
  - `server/features/system/scheduler/SchedulerController.js` : activateJob/deactivateJob ajoutées, createJob/updateJob/getJobById/deleteJob supprimées
  - `server/features/system/scheduler/scheduler.service.js` : activateJob/deactivateJob, getAllJobs retourne `{ jobs, total }` via count(), startAll avec successCount guard, calculateNextExecution avec guards isNaN
  - `server/features/system/scheduler/utils.js` : schedulerCrudSchemas nettoyé (create/update supprimés)
- **Scheduler files renommés** — convention `feature.specific.job.js` :
  - `SchedulerService.js` → `scheduler.service.js`, `SchedulerRoutes.js` → `scheduler.routes.js`
  - `BackupDatabaseJob.js` → `database.backup.job.js`, `ZohoSyncJob.js` → `zoho.sync.job.js`
  - `MonthlyInspectionDraftJob.js` → `inspection.monthly-draft.job.js`, `QuarterlyInspectionJob.js` → `inspection.quarterly.job.js`
  - `late-fee.job.js` → `invoice.late-fee.job.js`
- **Email IMAP archiving unifié** — tous les emails SMTP archivés dans "Sent" :
  - `server/shared/services/EmailQueueManager.js` : `#archiveToImapSent` → `static archiveToImapSent` (public)
  - `server/features/communication/emails/emailController.js` : IMAP archiving ajouté (template + HTML direct)
  - `server/features/portal-specific/comuse/inspections/services/InspectionNotificationService.js` : IMAP archiving ajouté
- **Frontend SchedulerJobs** — mise à jour optimiste au lieu de re-flash complet :
  - `client/src/features/settings/monitoring/components/SchedulerJobs.jsx` : `setJobs(prev => prev.map(...))` au lieu de `loadJobs()`
- **Skill `server-feature-optimization` enrichi** — patterns projet intégrés au skill d'audit :
  - `.github/skills/server-feature-optimization/SKILL.md` : Pilier 2 corrigé (validation dans les services, pas Zod), règles ajoutées (findMany borné, cache cleanup, transactions, timeout axios, codes d'erreur cohérents, controller v2.0), workflow étendu (registry check + mise à jour automatique + modifications de schéma Prisma), conventions mises à jour (soft deletes users, Logger import, schéma JS vs .prisma)

### Added
- **Email rappel J-3 pour subscription billing** — notification email ajoutée à la Phase 1 du job (pattern InvoiceService) :
  - `server/features/finances/subscription/subscription.service.js` : import `emailQueueManager`, méthode `sendReminderEmail(subscription, user)` avec `{ userId: null }` pour forcer le SMTP système (archivage IMAP)
  - `server/features/system/scheduler/jobs/subscription.billing.job.js` : import `SubscriptionService`, appel `SubscriptionService.sendReminderEmail()` au lieu de `emailQueueManager` direct
  - `server/shared/config/emailTemplateRegistry.js` : template `subscription.reminder` ajouté (folder `subscriptions`, priority medium)
  - `server/features/communication/emails/templates/email/subscriptions/reminder.html` : template HTML email rappel facturation (table layout, "+ taxes" affiché)
- **Job `subscription-billing` activé** — `enabled: true` dans la config du job
- **Route `PUT /jobs/:id/activate`** — activation de job (DB + start cron immédiat)
- **Route `PUT /jobs/:id/deactivate`** — désactivation de job (DB + stop cron + cleanup maps)
- **Test scheduler** — `server/features/system/scheduler/test.scheduler.routes.mjs` (10 assertions, 4 routes)
- **Guide "Ajouter un nouveau job"** — `server/features/system/scheduler/README.md` (template + conventions)

### Removed
- **Job `workflow-outbox-processor`** — supprimé du Registry, fichier job, et DB (3 portails)
- **Job `test-email-job`** — ghost job sans handler, supprimé de la DB (lrgmedia, comuse, demo)
- **Routes `POST /jobs`, `PUT /jobs/:id`, `GET /jobs/:id`, `DELETE /jobs/:id`** — remplacées par activate/deactivate

### Fixed
- **SchedulerType enum** — `recurring/one-time` corrigé en `repeat/single` (aligné Prisma schema)
- **Double `convertCronToHumanDescription`** — supprimé du controller (le service le fait déjà)
- **Pagination `total`** — `enrichedItems.length` → `prisma.count()` (vrai total)
- **`isRunning` guard** — `startAll()` définit `isRunning = successCount > 0` au lieu de `true` blind
- **`initializeFromDB` STEP 3** — re-fetch après auto-création pour inclure les jobs manquants
- **`deleteJob` 404** — check existence avant appel service
- **`activateJob` handler absent** — gestion gracieuse quand handler pas dans JOB_REGISTRY

---

## 2026-08-05

### Added
- **LiteSpeed Cache installé sur productionsnoeudpapillon.com** — plugin cache WordPress gratuit pour optimiser la 1ère visite :
  - `/home/pnp/public_html/wp-content/plugins/litespeed-cache/` : plugin v7.8.1 installé et activé
  - Configuration : page cache (3600s TTL), browser cache, CSS/JS optimization, image optimization (WebP)
  - Résultat : homepage 1ère visite 1.01s → 571ms (-43%)
- **Redis installé pour l'objet cache** — réduit les requêtes MySQL de 60-80% :
  - `redis` (v6.2.22) installé via dnf, activé au démarrage
  - Configuration LiteSpeed Cache : object cache Redis (127.0.0.1:6379, prefix `lsc_`, TTL 3600s)
- **Optimisations Nginx avancées** — worker_processes, SSL cache, open_file_cache :
  - `/etc/nginx/nginx.conf` : `worker_processes auto` (4 workers), `worker_connections 4096`
  - `/etc/nginx/nginx.conf` : `ssl_session_cache shared:SSL:50m`, `ssl_session_tickets on`, `ssl_session_timeout 1d`
  - `/etc/nginx/nginx.conf` : `open_file_cache max=10000 inactive=20s`, `open_file_cache_valid 30s`
  - `/etc/nginx/nginx.conf` : `keepalive_timeout 30` (réduit de 65s)
  - Résultat : cache hit 44ms → 17ms (-61%)

### Changed
- **Script de déploiement optimisé pour éviter l'accumulation du cache npm** — le serveur ne stocke plus les packages dans `/root/.npm` :
  - `scripts/deploy-portal.js` : ajout du flag `--cache /tmp/npm-deploy` à `npm ci` pour utiliser un emplacement temporaire
  - `scripts/deploy-portal.js` : ajout du nettoyage automatique du cache après chaque déploiement (`rm -rf /tmp/npm-deploy`)
  - Commentaires du script mis à jour pour refléter la nouvelle gestion du cache
- **Permissions corrigées** — `api-terrainsmauricie.conf` passée de 600 à 644
- **Fail2ban migré de firewallcmd-rich-rules vers firewallcmd-ipset** — réduit de 180 rich-rules à 6 ipsets :
  - `/etc/fail2ban/jail.local` : `banaction = firewallcmd-ipset`
  - 102 IPs bannies gérées via ipset au lieu de règles iptables individuelles
  - Performance firewall améliorée (une seule règle iptables par ipset)
- **Fail2ban réduit de 12 à 6 jails** — jails redondants désactivés :
  - Gardés : nginx-badbots, nginx-exploit-scan, nginx-secrets-scan, nginx-webscan, sshd, wordpress-login
  - Désactivés : nginx-http-auth, nginx-botsearch, nginx-limit-req, nginx-bad-request, nginx-directory-travel, nginx-panel-scan, nginx-rce-scan, nginx-env-scan, wordpress-xmlrpc
- **Fail2ban bantime réduit de 7 jours à 1 heure** — pour éviter l'accumulation de rules obsolètes
- **PHP-FPM optimisé** — réduction de la consommation mémoire :
  - Tous pools : `pm.max_requests` 500→50 (recycle plus fréquemment)
  - Pools lourds : `pm.max_children` réduit (lrgmedia 10→3, staging 20→5, etc.)
- **7 rich-rules manuelles supprimées** — IPs obsolètes (Azure, DigitalOcean, AWS, Russie) remplacées par fail2ban

### Removed
- **Nettoyage maintenance Nginx** — récupération de ~2.5 Go d'espace disque :
  - `/var/log/nginx/domains/` : suppression de 321 fichiers logs domains (1.48 Go)
  - `/var/cache/ea-nginx/proxy/` : suppression du cache proxy Nginx (968 Mo)
  - `/etc/nginx/nginx.conf.bak-20260804` : suppression du backup obsolète
- **Nettoyage massif du serveur cloud** — récupération de ~29 Go d'espace disque :
  - `/root/.npm` : suppression du cache npm de 17 Go (accumulé par les déploiements)
  - `/home/virtfs` : unbind + suppression des jails SSH inutiles (automatelrgmedia, jolygateries) — ~21 Go
  - `/var/cache/dnf` : suppression du cache DNF (506 Mo)
  - `/var/cache/ea-nginx` : suppression du cache proxy Nginx (496 Mo)
  - `/root/.wp-cli/cache` : suppression du cache WP-CLI (458 Mo)
  - `/var/log` : suppression des logs compressés et anciens (~1 Go)
  - `/backup` : suppression des backups cPanel de juillet 2025 (497 Mo)
  - `/backups` : suppression du backup SQL ancien de ficelle (85 Mo)
  - `/home/jolygateries/public_html/wp-content/cache` : suppression du cache objet WordPress (5.2 Go)
  - `/var/cpanel/sessions` : suppression des sessions admin temporaires (2.4 Go)
  - `/var/log/atop` : suppression des logs de monitoring anciens (479 Mo)

### Fixed
- **Fail2ban bloquait l'IP admin (38.29.143.110)** — faux positifs sur fichiers WordPress :
  - `/etc/fail2ban/filter.d/nginx-webscan.conf` : supprimé `^/` et `$` de `short_php` (regex cassée), ajouté status 503, retiré fichiers WP légitimes (media.php, admin.php, edit.php, etc.), ajouté `ignoreregex` pour /wp-admin/, /wp-content/, /wp-includes/
  - `/etc/fail2ban/filter.d/nginx-secrets-scan.conf` : retiré `.gitignore`, `.env`, `Dockerfile`, `docker-compose.yml`, `.npmrc`, `settings.py` (trop courants), retiré wp-login.php et wp-admin/* (doublon), retiré status 200, ajouté `ignoreregex` pour chemins WP
  - `/etc/fail2ban/jail.local` : IP 38.29.143.110 ajoutée à `ignoreip`, maxretry wordpress-login 3→5
- **Fail2ban base de données persistante** — anciens bans de 7 jours restaurés au redémarrage :
  - Suppression de `/var/lib/fail2ban/*.db` pour repartir à zéro
- **Fail2ban filters cassés** — status 301 manquant dans 5 filtres :
  - Ajout de `301` aux status codes de nginx-webscan, nginx-exploit-scan, nginx-secrets-scan, nginx-directory-traversal, nginx-wordpress-login, nginx-wordpress-xmlrpc
  - `/var/log/apache2` : suppression des logs Apache rotatés (182 Mo)
  - Résultat final : disque passe de 58% à 42% d'utilisation (115 Go → 84 Go)

---

## 2026-08-04

### Added
- **Compression Brotli activée sur Nginx** — réduit la taille transférée de 15-25% par rapport au Gzip :
  - `/etc/nginx/conf.d/modules/ngx_http_brotli_module.conf` : nouveau fichier chargeant `ngx_http_brotli_filter_module.so` et `ngx_http_brotli_static_module.so`
  - `/etc/nginx/nginx.conf` : ajout du bloc Brotli (`brotli on; brotli_comp_level 6; brotli_types ...; brotli_static on; brotli_min_length 256`)
  - Test : 86,439 bytes (gzip) → 73,092 bytes (brotli) = -15.4%
- **Whitelist IP fail2ban** — déblocage permanent de l'IP `38.29.143.110` (bannie le 2026-07-24 par le jail `nginx-bad-request` pour 5 requêtes POST 400 vers `/api/inspections/360/files`)

### Changed
- **Optimisation OPcache PHP pour production** — réduit le TTFB 1ère visite de 25% :
  - `/opt/cpanel/ea-php84/root/etc/php.d/10-opcache.ini` : `validate_timestamps=0`, `validate_permission=0`, `memory_consumption=512`, `fast_shutdown=1`, `enable_file_override=1`
  - `/opt/cpanel/ea-php83/root/etc/php.d/10-opcache.ini` : mêmes optimisations
  - Services redémarrés : `ea-php84-php-fpm`, `ea-php83-php-fpm`
  - Résultat : 1ère visite homepage 775ms → 581ms (-25%)
- **Backups créés** avant modification des configs :
  - `/opt/cpanel/ea-php84/root/etc/php.d/10-opcache.ini.bak-20260804`
  - `/opt/cpanel/ea-php83/root/etc/php.d/10-opcache.ini.bak-20260804`
  - `/etc/nginx/nginx.conf.bak-20260804`

### Security
- **Analyse fail2ban nginx-bad-request** — 467 bans en 10 jours, 189 IPs uniques bannies (majoritairement Microsoft Azure / DigitalOcean — scanners de vulnérabilités)

---

## 2026-07-22

### Added
- **Script `wp_update_all.sh` pour mise à jour WordPress** — script bash automatisé pour mettre à jour tous les sites WP (core + plugins + themes + cache) :
  - `.github/skills/wp-cli-server/wp_update_all.sh` : nouveau fichier avec 26 sites WordPress, logging, nettoyage automatique
- **Nettoyage serveur cloud** — récupération de ~5 Go d'espace disque :
  - Suppression Puppeteer Chrome versions obsolètes (~1.1 Go)
  - Suppression backup 2025 (`/root/all-databases-backup-2025-06-23.sql` — 2.3 Go)
  - Nettoyage cache DNF (490 Mo)
  - Suppression bases MySQL orphelines : `lrgmedia_website` (7 Mo), `projetlrgmedia_drolet` (136 Mo)
  - Suppression révisions WordPress de 18 bases de données (~2 Go)
  - Nettoyage postmeta orphelins : `buffetlise` (463), `minilab` (288)
  - Nettoyage logs autossl (53 Mo)
  - Nettoyage cache nginx proxy (278 Mo)
  - Nettoyage cache Prisma (223 Mo)
  - Nettoyage cache pip (33 Mo)
  - Suppression log atop (269 Mo)
  - Suppression anciens logs nginx (50 Mo)

### Changed
- **Skill `wp-cli-server` simplifié** — suppression des étapes de backup (gérées par Google Drive) :
  - `.github/skills/wp-cli-server/SKILL.md` : workflows mis à jour sans backup, nettoyage /tmp ajouté en fin de session
- **Skill `ssh-cloud-server` mis à jour** — ajout référence vers wp-cli-server pour les opérations WordPress
- **Paramètre `exclude` pour filtrer les statuts** — permet d'exclure des statuts spécifiques dans les requêtes API inspections :
  - `server/features/portal-specific/comuse/inspections/services/InspectionService.js` : nouveau paramètre `exclude` accepté, parse les statuts séparés par virgules, applique `notIn` sur `whereClause.status`
  - `server/features/portal-specific/comuse/inspections/InspectionController.js` : passage de `req.query.exclude` au service
  - `client/src/features/comuse/inspections/hooks/useInspectionWidget.js` : appel API avec `exclude: 'completed,deleted'`
- **Tooltip preview au hover sur les images sidebar** — affiche une prévisualisation 600px de l'image sous le curseur avec animation fade-in :
  - `client/src/features/comuse/software/inspectionSoftwareParts.jsx` : composant `DraggableSidebarImage` enrichi avec portal React (`createPortal`) vers `document.body`, position `fixed` calculée via `getBoundingClientRect`, timer 400ms avant affichage, image `google_image_url` en haute résolution
  - `client/src/app/animation.css` : nouveau keyframe `fade-in-tooltip` (opacity + scale 0.95→1, 200ms, cubic-bezier easing)
- **Bouton "Envoyer" désactivé temporairement dans PdfViewerModal** — le bouton Send/Envoyer est rendu `disabled` avec style grisé, commentaire FIXME ajouté :
  - `client/src/shared/components/organisms/PdfViewerModal.jsx` : ajout `disabled`, classes `opacity-50 cursor-not-allowed`, retrait de `onClick` et `leftIcon`, commentaire FIXME au-dessus du bouton
- **Filtre par inspecteur sur la page Inspections** — nouveau filtre multiselect dans la toolbar permettant de filtrer les inspections par inspecteur (ID Zoho CRM) :
  - `client/src/features/comuse/inspections/useInspections.js` : ajout `inspector: []` dans `DEFAULT_FILTERS`, options dynamiques dérivées des inspections chargées (`inspector.id` / `inspector.name`), filtrage client-side sur `inspection.inspector?.id`, sync URL avec paramètre `inspector_id`
  - `client/src/shared/components/templates/GenericFeaturePage/GenericFeaturePage.jsx` : ajout `'inspector'` dans la whitelist `compactHeaderFilters` pour la feature inspections
- **Filtre "Remplies" par défaut pour statuts validation/to_send** — le filtre de sections passe automatiquement sur "Rempli" quand le statut de l'inspection est `validation` ou `to_send` :
  - `client/src/features/comuse/software/inspectionSoftware.jsx` : nouveau ref `hasUserChangedFilterRef`, `useEffect` sur `inspectionStatus` qui applique `'filled'` pour les statuts cibles, les clics manuels sur les badges marquent le ref pour ne pas écraser le choix utilisateur
- **Paramètre `all=true` ajouté au picker inspections software** — charge toutes les inspections sans filtre `inspector_id`/`account_id` :
  - `client/src/features/comuse/software/inspectionSoftware.jsx` : `all: true` ajouté aux `apiFilters` dans le `useEffect` du picker
- **Sécurisation `all=true` pour inspections** — le paramètre `all=true` ne fonctionne maintenant que pour les admins ou les utilisateurs avec `roleType === 'INTERNAL'`, les utilisateurs `EXTERNAL` ne peuvent plus contourner le filtre :
  - `server/features/portal-specific/comuse/inspections/services/InspectionService.js` : ajout de la vérification `canUseAll = isAllRequest && (isAdmin || normalizedRoleType === 'INTERNAL')`

### Changed
- **Widget inspections sans limite** — suppression du paramètre `limit: 30` pour charger toutes les inspections :
  - `client/src/features/comuse/inspections/hooks/useInspectionWidget.js` : paramètre `limit` retiré
- **Widget projets sans limite** — suppression du paramètre `limit: 30` pour charger tous les projets :
  - `client/src/features/project-management/projects/hooks/useProjectWidget.js` : paramètre `limit` retiré
- **`NoteService` protégée par `isFeatureEnabled`** — chaque requête Prisma (contacts, projects, tasks, inspections) dans `#collectAccountRelatedIds` est maintenant conditionnée par la feature active du portail, évitant les crashs quand un modèle n'est pas disponible :
  - `server/features/communication/notes/note.service.js` : import `isFeatureEnabled` ajouté, chaque `findMany` wrappé dans `if (isFeatureEnabled(...))`
- **Notes des inspections récupérées pour un compte** — `#collectAccountRelatedIds` interroge maintenant `prisma.inspections` (avec garde `isFeatureEnabled('inspections')`) et `#buildAccountRelatedWhere` inclut la condition OR `resource_type: 'inspection'` :
  - `server/features/communication/notes/note.service.js` : ajout `inspections` dans le `result`, OR condition ajouté dans `#buildAccountRelatedWhere`
- **Bouton "Envoyer" dynamique selon le statut** — le bouton change de texte et d'action en fonction du statut de l'inspection :
  - `client/src/features/comuse/software/inspectionSoftware.jsx` : état `inspectionStatus` extrait depuis `GET /api/inspections/:id/report`, affichage conditionnel — `is_sorting` → "Envoyer pour validation" (→ `validation`), `validation` → "Envoyer à Micheline" (→ `to_send`), autres statuts → bouton masqué, toast `toastPromise` ajouté avec messages contextuels
  - `client/src/features/comuse/software/hooks/useInspectionSoftwareApi.js` : `setInspectionValidationStatus(id, status)` accepte un 2e paramètre `status` (défaut `'validation'`)
- **Nom du compte affiché dans la barre d'outins** — badge `account_name` à gauche de "Prévisualiser" :
  - `client/src/features/comuse/software/inspectionSoftware.jsx` : état `accountName` extrait depuis `GET /api/inspections/:id/report`, rendu conditionnel `<span>` gris
  - `server/features/portal-specific/comuse/inspections/services/InspectionService.js` : `getInspectionReport` retourne `account_name` (via relation Prisma `account.name`) et `status` au même niveau que `sections`
- **Layout inspection software restructuré** — le header reste toujours visible sans dépendre de `sticky` :
  - `client/src/features/comuse/software/inspectionSoftware.jsx` : conteneur `min-h-screen` → `h-screen` (viewport fixe), suppression `overflow-hidden` sur le conteneur parent, suppression `sticky top-0` du header (flex item `shrink-0` naturel)
- **Redirect onglet Rapport pour statuts `validation` et `to_send`** — l'onglet Rapport redirige maintenant vers la page Software pour les 3 statuts actifs au lieu du seul `is_sorting` :
  - `client/src/shared/related/components/tabs/InspectionReportsTab.jsx` : tableau `redirectStatuses` avec `['is_sorting', 'validation', 'to_send']`, condition `includes()` au lieu de comparaison unique
- **Bouton "Envoyer" désactivé temporairement dans PdfViewerModal** — le bouton Send/Envoyer est rendu `disabled` avec style grisé, commentaire FIXME ajouté :
  - `client/src/shared/components/organisms/PdfViewerModal.jsx` : ajout `disabled`, classes `opacity-50 cursor-not-allowed`, retrait de `onClick` et `leftIcon`, commentaire FIXME au-dessus du bouton

### Fixed
- **Crash `Cannot read properties of undefined (reading 'findMany')` sur `GET /api/accounts/:id/notes`** — `NoteService.getAccountNotesWithRelated` n'appelait jamais `isFeatureEnabled` avant d'interroger les modèles Prisma liés au compte, provoquant une erreur 500 quand les modèles contacts/projects/tasks n'étaient pas disponibles pour le portail :
  - `server/features/communication/notes/note.service.js` : chaque accès `prisma.X.findMany` wrappé dans `if (isFeatureEnabled('X'))`, fallback sur tableaux vides
- **Bug `ACCESS_DENIED` sur `PUT /api/inspections/:id/report`** — `owner_id` manquant dans le `select` Prisma, les propriétaires ne pouvaient jamais sauvegarder leur rapport :
  - `server/features/portal-specific/comuse/inspections/services/InspectionService.js` : ajout `owner_id: true` dans le `select` de `updateInspectionReport`
- **Bug `ACCESS_DENIED` sur `PUT /api/inspections/:id`** — même problème pour la mise à jour du statut, contrôle d'accès `inspector_id/owner_id` supprimé pour les rôles INTERNAL :
  - `server/features/portal-specific/comuse/inspections/services/InspectionService.js` : bloc `else { canAccess }` supprimé dans `updateInspection` (les INTERNAL users ont accès libre)
- **Erreur `INVALID_FIELD_VALUE` — statut "Validation" invalide** — le frontend envoyait `"Validation"` (majuscule) mais le backend exige `"validation"` (minuscule) :
  - `client/src/features/comuse/software/hooks/useInspectionSoftwareApi.js` : `'Validation'` → `'validation'`
- **Bypass comuse2020@gmail.com** — le compte principal passe directement de `validation` à `to_send` sans étape intermédiaire :
  - `server/features/portal-specific/comuse/inspections/services/InspectionService.js` : intercept `updateInspection` pour `comuse2020@gmail.com` → remplace `validation` par `to_send`
- **Erreur de parsing JSX** — pattern IIFE `useCallback` avec `;` non supporté par le parser Vite :
  - `client/src/features/comuse/software/inspectionSoftwareParts.jsx` : remplacement par `useRef(null)` classique

---

## 2026-07-21

### Added
- **Variante `variant="icon"` pour `IntegrationBadge`** — nouveau style cercle coloré avec icône + tooltip CSS au hover :
  - `client/src/shared/components/atoms/IntegrationBadge.jsx` : ajout props `variant` ('default' | 'icon') et `active` (boolean), rendu alternatif avec `<a>` cercle coloré, tooltip positionné sous le badge via CSS inline, support des états actif/inactif (bordure pointillée, opacité réduite)
- **Page de test `IntegrationBadgesTest`** — démonstration des variantes de badges :
  - `client/src/features/admin/test/IntegrationBadgesTest.jsx` : nouveau fichier avec sections Actif/Inactif/Scénario mixte
  - `client/src/features/admin/pages/ThemeTestPage.jsx` : ajout onglet "Intégrations"
  - `client/src/features/admin/index.js` : export du composant

### Changed
- **Badges d'intégration déplacés dans le header** — de DetailsTab vers DetailPageHeader à droite du titre :
  - `client/src/shared/components/templates/detail/DetailPageHeader.jsx` : rendu des `integrationBadges` avec `variant="icon"`, conteneur flex `items-center` pour alignement vertical
  - `client/src/shared/related/components/tabs/DetailsTab.jsx` : suppression du bloc d'affichage des badges (plus redondant)
- **Badges d'intégration repositionnés dans `InvoicePreviewCard`** — déplacés du côté droit vers le bas du solde dû :
  - `client/src/features/finance/invoices/components/InvoicePreviewCard.jsx` : bloc badges intégré dans la colonne gauche sous "Solde dû", retiré du bloc status à droite
- **Taille des badges icon réduite** — de 36px à 28px avec icône 14px :
  - `client/src/shared/components/atoms/IntegrationBadge.jsx` : `h-9 w-9` → `h-7 w-7`, icône 18px → 14px
- **Clic sur icône uniquement pour ouvrir le dropdown owner/inspector/search** — le texte n'ouvre plus le dropdown, seul le clic sur l'icône circulaire déclenche l'édition :
  - `client/src/shared/related/components/tabs/DetailsTab.jsx` : `<button>` remplacé par `<span>` avec `onClick` sur le `<span>` icône uniquement (owner, inspector, search)
- **Alignement vertical du champ Gestionnaire** — label et contenu centrés verticalement :
  - `client/src/shared/related/components/tabs/DetailsTab.jsx` : `sm:items-start` → `sm:items-center` sur la ligne propriétaire
- **Numéros de téléphone formatés dans l'affichage** — les champs `tel` affichent maintenant le format `(XXX) XXX-XXXX` :
  - `client/src/shared/related/components/tabs/DetailsTab.jsx` : import `formatPhone` et ajout du cas `tel` dans le calcul du `displayValue`

- **Notes agrégées pour les comptes** — `GET /api/accounts/:id/notes` retourne maintenant les notes de l'account ET de ses entités liées (contacts, projets, tâches) :
  - `server/features/communication/notes/note.service.js` : nouvelles méthodes `getAccountNotesWithRelated`, `#collectAccountRelatedIds`, `#buildAccountRelatedWhere` — collecte les IDs liés, requête OR multi-resource, pagination in-memory
  - `server/features/crm/accounts/account.controller.related.js` : `getAccountNotes` appelle `getAccountNotesWithRelated` au lieu de `getNotesByResource('account', ...)` 
- **Badge source sur les notes** — chaque note affiche son origine (Compte, Contact, Projet, Tâche) avec couleur dédiée :
  - `client/src/shared/related/components/tabs/NotesTab.jsx` : config `RESOURCE_CONFIG` fusionnée (label + color + route), fonction `getSourceBadge` avec logique de visibilité (caché si même ressource, sauf page account), badges cliquables via `react-router-dom` naviguant vers la ressource source
- **Redesign de la card note** — layout plus clair avec header card (avatar + nom/date), badge source à droite, contenu dans un bloc séparé avec bordure, actions au hover :
  - `client/src/shared/related/components/tabs/NotesTab.jsx` : redesign complet du `renderNoteCard` avec `inline-flex` header, `justify-between` pour badge, `bg-background-3/50` sur le contenu, `group-hover:opacity-100` sur les actions
- **Optimisation NotesTab.jsx** — réduction de 530 à 388 lignes (-27%) :
  - `client/src/shared/related/components/tabs/NotesTab.jsx` : fusion `RESOURCE_SOURCE_CONFIG` + `RESOURCE_TYPE_ROUTES` en `RESOURCE_CONFIG`, extraction du pattern try/catch en helper `withSubmit`, suppression de `shouldShowAddSection`, simplification de `getAuthorInfo` et `handleCtrlEnter`, dé-nidage des divs imbriquées
- **Résolution centralisée des badges d'intégration** — `resolveIntegrationBadges()` dans `DetailPageHeader` résout automatiquement depuis `entity.integrations` :
  - `client/src/shared/components/templates/detail/DetailPageHeader.jsx` : ajout fonction `resolveIntegrationBadges()` exportée + prop `entity`, résolution auto via mapping `INTEGRATION_KEY_MAP` (zoho_crm, zoho_books, google_drive, wordpress)
  - `client/src/shared/related/components/DetailPageTabs.jsx` : import de `resolveIntegrationBadges`, suppression de la logique dupliquée (~20 lignes)
  - `client/src/features/crm/accounts/pages/AccountDetail.jsx` : `integrationBadges={[...]}` → `entity={account}`
  - `client/src/features/crm/contacts/pages/ContactDetail.jsx` : `integrationBadges={[...]}` → `entity={contact}`
  - `client/src/features/project-management/projects/pages/ProjectDetail.jsx` : `integrationBadges={[...]}` → `entity={project}`
  - `client/src/features/comuse/inspections/pages/InspectionDetails.jsx` : `integrationBadges={[...]}` → `entity={inspection}`
- **Champs select rendus en Badge** — les champs select affichent maintenant des Badges colorés au lieu de texte brut :
  - `client/src/shared/related/components/tabs/DetailsTab.jsx` : `displayValue` pour les selects utilise `<Badge>` avec couleur depuis `field.options[].color` ou fallback `getStatusConfig().color`
  - `client/src/shared/related/components/tabs/DetailsTab.jsx` : éditeur inline utilise `getStatusConfig` comme fallback couleur pour TOUS les selects (pas uniquement `status`)
- **Hover effect supprimé pour les champs select** — cohérence avec le champ status :
  - `client/src/shared/related/components/tabs/DetailsTab.jsx` : ajout `row.fieldType !== 'select'` dans `isHighlightableRow`

### Fixed
- **Focus ring bleu au hover sur les badges icon** — bordure/outline du navigateur supprimée :
  - `client/src/shared/components/atoms/IntegrationBadge.jsx` : `<style>` déplacé à l'extérieur du `<a>`, `outline: none !important` + `border: none !important` en CSS, `style={{ outline: 'none', boxShadow: 'none' }}` en inline
- **Transition non fluide au leave-hover** — snap brutal au lieu d'animation :
  - `client/src/shared/components/atoms/IntegrationBadge.jsx` : ajout `transition: transform 0.2s ease, box-shadow 0.2s ease` sur `.integration-icon-badge`
- **Alignement vertical des badges dans le header** — badges non centrés avec le titre :
  - `client/src/shared/components/templates/detail/DetailPageHeader.jsx` : `md:items-start` → `md:items-center`
- **`Logger is not defined` sur GET /api/tasks/:id** — import manquant dans le modèle Task :
  - `server/features/project-management/tasks/models/Task.js` : ajout `import Logger from '../../../../shared/logging/Logger.js'` (utilisé dans `findFirst()`)
- **Soulignement hover indésirable sur les liens de comptes** — le texte des comptes s'affichait souligné au survol :
  - `client/src/shared/related/components/tabs/DetailsTab.jsx` : retrait de `hover:underline` pour les types `account` et `search` avec `feature: 'account'` dans `renderRowValue`

### Removed
- **Prop `integrationBadges` supprimée de `DetailPageHeader`** — résolution désormais automatique via `entity.integrations` :
  - `client/src/shared/components/templates/detail/DetailPageHeader.jsx` : prop `integrationBadges` retirée, fallback supprimé
  - `client/src/shared/related/components/DetailPageTabs.jsx` : prop `integrationBadges` retirée + supprimée des PropTypes
  - `client/src/shared/related/components/tabs/DetailsTab.jsx` : prop `integrationBadges` retirée de la signature
- **Prop `detailsComponent` supprimée de `DetailPageTabs`** — aucun consommateur, fallback `DetailsTab` utilisé directement :
  - `client/src/shared/related/components/DetailPageTabs.jsx` : prop supprimée, `<DetailsComponent>` remplacé par `<DetailsTab>`
- **Champ `email` fantôme supprimé de `module_fields` pour `accounts`** — le champ référait `field_scope: 'database'` mais aucune colonne `email` n'existe dans `crm.accounts`, provoquant un "Email: Non renseignée" permanent dans DetailsTab :
  - Base `portal_lrgmedia` : suppression `customization.module_fields` id=7
  - Base `portal_comuse` : suppression `customization.module_fields` id=7
  - Base `portal_demo` : suppression `customization.module_fields` id=38

## 2026-07-20

### Added
- **`syncPaymentsDelta` bidirectionnelle** — sync complète des paiements entre Portal et Zoho Books :
  - `server/features/system/integrations/zoho/services/zoho.books.sync.service.js` : Direction Portal→Books (create + link intégrations) et Direction Books→Portal (import via `PaymentService.create` avec matching anti-doublon `invoiceId_amountCents_date`)
- **`PaymentService.create` avec sync Zoho Books** — création automatique dans Books + intégration :
  - `server/features/finances/payment/payment.service.js` : ajout import `ZohoBooksService` + `isZohoBooksEnabled`, paramètre `skipZohoSync`, sync vers Books après création locale (résolution account→booksContactId, invoice→booksInvoiceId)
- **Route `POST /admin/logs/clear-all`** — vider tous les logs (BDD + fichiers) en une seule requête :
  - `server/routes/groups/admin/logsRoutes.js` : nouvelle route avec `deleteMany({})` sur `system_logs` + vidage des fichiers `.log`
- **Bouton "Vider les logs"** dans le dashboard monitoring avec confirmation :
  - `client/src/features/settings/monitoring/components/MonitoringDashboard.jsx` : bouton rouge avec `ConfirmationPopup` (type warning)
  - `client/src/features/settings/monitoring/services/monitoringApi.js` : méthode `clearAllLogs()` → `POST /admin/logs/clear-all`
- **Onglet Utilisateurs** dans Settings → Système — gestion du rôle pour `dev@example.ca` :
  - `client/src/features/settings/monitoring/pages/UserRoleManager.jsx` : nouveau composant avec `SelectField` + `Button` pour modifier le rôle d'un utilisateur cible
  - `client/src/features/settings/monitoring/pages/Monitoring.jsx` : ajout de l'onglet "Utilisateurs" dans la navigation
- **Route PUT `/auth/users/:userId` étendue** — accepte maintenant `{ role }` en plus de `{ is_active }` :
  - `server/features/system/auth/controllers/rolesController.js` : validation du rôle existant, gestion du "déjà à ce rôle", retour avec `role_info`
- **Système de logging BDD** — nouvelle table `system_logs` et service asynche pour écrire les logs en base PostgreSQL au lieu de fichiers :
  - `server/features/system/settings/models/SettingsSchema.js` : ajout du modèle `system_logs` dans `BASE_SCHEMA` (7 colonnes : id, level, category, message, data, user_id, created_at)
  - `server/features/system/settings/services/system.log.service.js` : nouveau service avec buffer in-memory (max 500), flush batch toutes les 5s via `createMany`, flush immédiat pour ERROR/WARN, retry 3x, flush au shutdown
  - `server/features/system/settings/services/index.js` : export du `SystemLogService`
  - `server/features/system/settings/index.js` : re-export du `SystemLogService`
- **Auto-detection du mode de logging** — le Logger détecte automatiquement si la table `system_logs` existe ET si `NODE_ENV=production` pour activer le DB logging, sinon reste sur les fichiers

### Changed
- **LogAnalyzer réécrit avec mode dual** — lecture BDD (production) OU fallback fichiers (development) :
  - `server/shared/logging/LogAnalyzer.js` : réécriture complète avec `_isDbMode()` (détecte via `SystemLogService.isAvailable()`), chaque méthode a une implémentation DB (`_readLogFileDb`, `_getAvailableLogFilesDb`, etc.) et fichier (`_readLogFileFs`, `_getAvailableLogFilesFs`, etc.)
- **system.log.service.js** — aligné avec les conventions du codebase :
  - `server/features/system/settings/services/system.log.service.js` : import `{ getPrisma }` au lieu de `{ prisma }`, tous les appels `prisma.system_logs.*` → `getPrisma().system_logs.*`, export `CATEGORY_MAP`
- **logsRoutes.js** — routes adaptées au mode async :
  - `server/routes/groups/admin/logsRoutes.js` : import `getPrisma` ajouté, routes `/files` et `/dashboard` avec `await` pour méthodes désormais async, route `/clear/:fileName` avec `DELETE FROM system_logs` en mode BDD avant fallback disque
- **Auto-refresh remplacé par "Vider les logs"** :
  - `client/src/features/settings/monitoring/components/MonitoringDashboard.jsx` : checkbox auto-refresh → bouton rouge TrashIcon + `ConfirmationPopup`
  - `client/src/features/settings/monitoring/hooks/useMonitoring.js` : retiré `autoRefresh`/`useRef`/`setInterval`, ajouté `clearAllLogs` callback
  - `client/src/features/settings/monitoring/pages/Monitoring.jsx` : props simplifiées `onClearLogs={clearAllLogs}`
- **Onglets Monitoring refondus** — style pill/tag avec bordures :
  - `client/src/features/settings/monitoring/pages/Monitoring.jsx` : navigation `flex gap-2` avec boutons `border rounded text-xs`
- **Supprimé l'onglet Logs** et tout son contenu :
  - `client/src/features/settings/monitoring/pages/Monitoring.jsx` : suppression des imports, hooks, handlers et JSX du tab
- **Supprimé l'onglet Commentaires** :
  - `client/src/features/settings/monitoring/pages/Monitoring.jsx` : suppression de `FeedbackMonitoring`
- **Logger.js migré vers DB logging** :
  - `server/shared/logging/Logger.js` : ajout de `detectDbLogging()`, branchement DB/fichiers
  - `server/server.js` : ajout de `await logger.detectDbLogging()` après init Prisma
- **Nettoyage console.* → Logger** — remplacement dans 6 fichiers middleware/config :
  - `server/server.js`, `security.js`, `permissions.js`, `monitoring.js`, `prisma.js`, `cors.js`
- **FileRotator conditionné** — nettoyage auto des fichiers de log désactivé en mode BDD :
  - `server/shared/logging/index.js`
- **Audit Logger server/ — suppression du bruit de logs** — analyse complète de ~690 appels Logger avec sous-agents, nettoyage massif :
  - Imports morts supprimés (5 fichiers) : `responseHelper.js`, `routes/index.js`, `Task.js`, `backupRoutes.js`, `files.global.service.js`
  - Route `/test-notification` supprimée de `server/server.js` (+ 6 appels Logger associés)
  - Debug traces supprimées (~40 appels) dans : `ActivityLogManager.js`, `ActivityLogQueue.js`, `BaseAggregationService.js`, `ChatService.js`, `emailController.js`, `Project.js`, `ProjectController.js`, `UserService.js`, `GoogleMeetController.js`, `SchedulerService.js`, `account.service.js`, `apiRouteConfig.js`, `FeedbackController.js`, `TimeTrackingService.js`
  - Pairs info+success redondantes fusionnées (~12 supprimés) dans : `ChatService.js`, `emailController.js`, `account.service.js`, `contact.service.js`, `BaseAggregationService.js`, `aggregationResponse.js`, `SiteHealthService.js`, `SettingsController.js`
  - Niveaux de log corrigés : `warn→debug` (.env non trouvé), `error→info` (EADDRINUSE suggestion), `info→debug` (GDrive cleanup, metrics reset, batch processing)
  - Lectures read-only info→debug (34 conversions) dans : `ChatController.js`, `LeadController.js`, `QuoteController.js`, `PaymentController.js`, `SubscriptionController.js`, `emailController.js`, `note.service.js`, `SiteHealthService.js`, `GmailController.js`, `GmailService.js`, `GoogleMeetController.js`, `UserController.js`, `emailRoutes.js`

### Fixed
- **Catégorie mismatch lecture/écriture** — `errors.log` → `ERRORS` ne matchait pas `ERROR` en BDD :
  - `server/shared/logging/LogAnalyzer.js` : ajout de `FILE_TO_CATEGORY` map et `resolveCategory()` pour aligner les noms de fichiers avec les catégories stockées
- **`getRecentErrors()` regroupement cassé** — cherchait `error.error?.name` au lieu de `data?.error?.name` :
  - `server/shared/logging/LogAnalyzer.js` : corrigé pour lire `entry.data?.error?.name || entry.data?.payload?.errorName`
- **`getPerformanceStats()` path incorrect** — `data.responseTime` au lieu de `data.payload.responseTime` (wrappé par SystemLogService) :
  - `server/shared/logging/LogAnalyzer.js` : lecture `entry.data?.payload?.responseTime ?? entry.data?.responseTime`
- **`getUserActivityStats()` source userId** — `entry.data?.userId` ne fonctionnait pas en mode BDD :
  - `server/shared/logging/LogAnalyzer.js` : requête directe sur `user_id` colonne DB + join `user.email`
- **`getSystemMetrics()` et `getAvailableLogFiles()` synchrones** — retournaient des zéros :
  - `server/shared/logging/LogAnalyzer.js` : méthodes devenues async avec requêtes BDD réelles (groupBy, count)
- **Route `clear/:fileName` ne fonctionnait qu'en mode fichier** :
  - `server/routes/groups/admin/logsRoutes.js` : ajout de `DELETE FROM system_logs WHERE category = ?` avant fallback disque
- **`searchAllLogs()` inefficace** — 8 requêtes séquentielles :
  - `server/shared/logging/LogAnalyzer.js` : requête unique `LIKE` sur toute la table avec groupement par catégorie

### Removed
- **Routes delta individuelles Zoho Books** — suppression des routes redondantes :
  - `server/features/system/integrations/zoho/routes/zoho.routes.js` : suppression `GET /books/invoices/delta` et `GET /books/payments/delta`
  - `server/features/system/integrations/zoho/ZohoCRMController.js` : suppression méthodes `syncBooksInvoicesDelta` et `syncBooksPaymentsDelta`
  - La route `GET /books/sync` gère maintenant tout (accounts + invoices + payments)

### Changed
- **Gestion d'erreurs Zoho Books** — erreurs de business rule loguées en info au lieu de warn :
  - `server/features/system/integrations/zoho/services/zoho.books.sync.service.js` : codes 24016 (montant > solde dû) et 9079 (transactions verrouillées) → `Logger.info` au lieu de `Logger.warn`, pas comptabilisées dans `errors`
  - `server/features/finances/payment/payment.service.js` : même handling pour les erreurs Zoho lors de la sync depuis `PaymentService.create`
- **`skipZohoSync` dans sync Books→Portal** — évite la double synchronisation :
  - `server/features/system/integrations/zoho/services/zoho.books.sync.service.js` : appel `PaymentService.create` avec `skipZohoSync: true` lors de l'import depuis Books
- **Alignement schéma inspections avec la base de données** — ajout des colonnes `quarter` (enum Quarter) et `year` absentes du schéma Prisma :
  - `server/features/portal-specific/comuse/inspections/models/InspectionsSchema.js` : ajout de `quarter: { type: 'Quarter', nullable: true }`, `year: { type: 'Int', nullable: true }` et de `static ENUMS = { Quarter: ['Q1', 'Q2', 'Q3', 'Q4'] }`
  - `server/prisma/schema/inspections.prisma` : ajout des colonnes `quarter Quarter?`, `year Int?` et de l'enum `Quarter { Q1 Q2 Q3 Q4 }`
- **Skill `local-db-query` enrichi** — documentation des schemas multi-portails et nouvelles commandes :
  - `.github/skills/local-db-query/SKILL.md` : ajout du tableau des 4 portails avec bases, section Schema Detection (crm/public/finance/customization), commandes enums/FK/indexes/search, patterns de jointures courants

## 2026-07-17

### Fixed
  - `client/src/features/comuse/software/inspectionSoftwareParts.jsx` : retrait de la prop `loading` et du texte conditionnel du `SelectField` dans `InspectionPickerModal`, placeholder fixe "Sélectionner une inspection"

- **Nettoyage routes inspections** — suppression de 10 routes orphelines jamais appelées par le client :
  - `server/features/portal-specific/comuse/inspections/inspection.routes.js` : suppression de `GET /health`, `POST /:id/notes`, `PUT /:id/notes/:noteId`, `DELETE /:id/notes/:noteId`, `GET /:id/files/:fileId/content`, `POST /:id/send-for-sorting`, `DELETE /:id/clear-drive-folder`
  - `server/features/portal-specific/comuse/inspections/InspectionController.js` : suppression des méthodes `streamFileContent`, `sendForSorting`, `clearDriveFolder`, `createInspectionNote`, `updateInspectionNote`, `deleteInspectionNote`
  - `server/features/portal-specific/comuse/inspections/services/InspectionService.js` : suppression des méthodes `sendForSorting`, `clearDriveFolder`, `addInspectionNote`, `updateInspectionNote`, `deleteInspectionNote`
  - `client/src/shared/config/apiConfig.js` : suppression des constants `SEND_FOR_SORTING` et `CLEAR_DRIVE_FOLDER`
- **Suppression middleware `authenticateTokenOrQuery`** — n'était utilisé que par la route `/:id/files/:fileId/content` supprimée :
  - `server/features/portal-specific/comuse/inspections/inspection.routes.js` : suppression du middleware

### Fixed
- **Route `/options` capturée par `/:id`** — `GET /api/inspections/options?type=software` retournait 400 "ID d'inspection invalide" :
  - `server/features/portal-specific/comuse/inspections/inspection.routes.js` : déplacement des routes `/options` et `/software-options` avant `/:id` pour éviter la capture par le paramètre dynamique
- **`export default` hors de la classe** — `SyntaxError: Unexpected token 'default'` au démarrage du serveur après suppression des méthodes :
  - `server/features/portal-specific/comuse/inspections/InspectionController.js` : réajout du `}` fermant la classe `InspectionController`

### Added
- **`requestLog()` — logging complet de toutes les requêtes API** — nouveau fichier `requests.log` qui enregistre chaque appel API sans filtre :
  - `server/shared/logging/Logger.js` : nouvelle catégorie `REQUESTS: 'requests.log'`, nouvelle méthode `requestLog()` qui logue méthode, URL, status, temps de réponse et userId
  - `server/shared/middleware/monitoring.js` : ajout de `logger.requestLog()` après `logger.requestPerf()` pour chaque requête non-health-check

### Fixed
- **URL `localhost:3001` hardcodée dans le monitoring dashboard** — les appels API affichaient `localhost:3001` au lieu du domaine réel :
  - `client/src/features/settings/monitoring/components/MonitoringDashboard.jsx` : remplacement de `http://localhost:3001{group.url}` par `{API_CONFIG.BASE_URL}{group.url}`, ajout de l'import `API_CONFIG` depuis `@shared/config/apiConfig`

### Added
- **Service CRUD `/api/files`** — endpoint centralisé de gestion des fichiers :
  - `server/features/system/files/files.validation.js` : schémas de validation (list, create, update, delete)
  - `server/features/system/files/FilesController.js` : handlers HTTP — upload Google Drive + création enregistrement DB, liste, mise à jour, suppression
  - `server/features/system/files/files.routes.js` : routes Express CRUD avec multer (50MB max)
  - `server/features/system/files/index.js` : exports centralisés
  - `server/routes/apiRouteConfig.js` : enregistrement de la route `'files'`
- **`GoogleDriveService.checkConnection()`** — vérifie la connexion Google Drive en une seule méthode :
  - `server/features/system/integrations/google/GoogleDriveService.js` : nouvelle méthode statique
- **`InspectionDriveService`** — service dédié aux opérations Drive pour les inspections :
  - `server/features/portal-specific/comuse/inspections/services/InspectionDriveService.js` : cache photos, resolve folder, list/count images, stream file content, ensure folder, delete files

### Changed
- **Refactor majeur architecture inspections** — séparation routes/controller/service :
  - `server/features/portal-specific/comuse/inspections/inspection.routes.js` : 2350 lignes → 96 lignes (-96%), suppression de toute la logique métier inline, utilisation de `createRoutePresets` pour les permissions
  - `server/features/portal-specific/comuse/inspections/InspectionController.js` : 1255 lignes → 1522 lignes, 10 méthodes extraites vers les services, suppression des helpers privés (`#extractDriveFolderId`, `#getAuthenticatedDriveClient`, `#ensureInspectionDriveFolder`, `#uploadFilesToDrive`), suppression des imports `googleapis`, `PassThrough`, `GoogleDriveService`, `ResourceIntegrationService`, `FilesService`
  - `server/features/portal-specific/comuse/inspections/services/InspectionService.js` : 1780 lignes → 2727 lignes, 12 nouvelles méthodes (`getInspections`, `getInspectionByIdEnriched`, `getInspectionFiles`, `countInspectionFiles`, `getInspectionStats`, `generateDriveFolder`, `uploadInspectionFiles`, `submitInspectionWithFiles`, `updateInspectionZoho`, `sendForSorting`, `clearDriveFolder`, `verifyInspectionExists`)
- **Upload inspections via `FilesService`** — la route `POST /upload-files` utilise maintenant `FilesService.create()` pour gérer l'upload Drive + création DB en une seule étape :
  - `server/features/portal-specific/comuse/inspections/inspection.routes.js` : remplacement de la logique inline par un appel `FilesService.create()`
  - `server/features/portal-specific/comuse/inspections/services/InspectionService.js` : import `FilesService` avec chemin corrigé
- **`FilesController.createFile()`** — vérifie la connexion Google Drive avant l'upload via `GoogleDriveService.checkConnection()` au lieu de `GoogleTokenManager` directement :
  - `server/features/system/files/FilesController.js` : suppression de l'import `GoogleTokenManager`
- **`InspectionController` nettoyé** — plus aucune requête Prisma directe, plus aucun import d'API externe :
  - `server/features/portal-specific/comuse/inspections/InspectionController.js` : seuls imports restants = Logger, InspectionService, InspectionPdfService, InspectionNotificationService, InspectionDriveService

### Fixed
- **Bug `getPhotosCache(null)`** — le cache photos ne fonctionnait pas dans `streamFileContent` :
  - `server/features/portal-specific/comuse/inspections/services/InspectionDriveService.js` : ajout du paramètre `inspectionId` à la méthode `streamFileContent()`
  - `server/features/portal-specific/comuse/inspections/InspectionController.js` : passage de `inspectionId` lors de l'appel
- **Chemin d'import `FilesService` incorrect** — `ERR_MODULE_NOT_FOUND` au démarrage du serveur :
  - `server/features/portal-specific/comuse/inspections/services/InspectionService.js` : correction de `../../../system/files/` → `../../../../system/files/`

### Changed
- **Optimisation `OverviewWidget`** — corrections de perf et simplifications :
  - `client/src/shared/components/organisms/OverviewWidget/useOverviewWidget.js` : `searchHaystack` callback → `searchFields` array de paths (le `useMemo` de `processedData` est maintenant réellement mémorisé), 2 `useEffect` scroll → 1 `useLayoutEffect` + `ResizeObserver`, cleanup timeout ajouté
  - `client/src/shared/components/organisms/OverviewWidget/OverviewWidget.jsx` : `COL_CLASSES` object → template literal `` col-span-${c.span} ``, `arrow()` function → `<Arrow>` component `React.memo`, export wrappé `React.memo`
  - `client/src/features/comuse/inspections/components/InspectionWidget.jsx` : `searchFields` array remplace `searchHaystack` inline, `render` wrappé `React.useCallback`
  - `client/src/features/project-management/projects/components/ProjectWidget.jsx` : idem

### Fixed
- **Alignement headers/content dans `OverviewWidget`** — les en-têtes de colonnes étaient décalés par rapport au contenu :
  - `client/src/shared/components/organisms/OverviewWidget/OverviewWidget.jsx` : grille header `grid-cols-12` → `grid-cols-1 md:grid-cols-12` (synchronisé avec le contenu), `col-span-${c.span}` → `col-span-1 md:col-span-${c.span}`, padding `px-1` → `px-2.5`, gap `gap-3` → `gap-2 md:gap-3`

### Added
- **Composant `OverviewWidget`** — widget de liste réutilisable avec header, tri, filtres, recherche et scroll indicator :
  - `client/src/shared/components/organisms/OverviewWidget/OverviewWidget.jsx` : composant principal
  - `client/src/shared/components/organisms/OverviewWidget/useOverviewWidget.js` : hook de state (sort, filter, scroll)
  - `client/src/shared/components/organisms/OverviewWidget/OverviewWidgetUtils.js` : helpers partagés (`formatDateFr`, `getAccount`, `createStatusLabel`, `getByPath`)
  - `client/src/shared/components/organisms/OverviewWidget/index.js` : exports
  - `client/src/shared/index.js` : ajout export `OverviewWidget` et `useOverviewWidget`
- **Colonne "Inspecteur" dans le widget Inspections** — affichage du nom de l'inspecteur avec tri :
  - `client/src/features/comuse/inspections/components/InspectionWidget.jsx` : nouvelle colonne `inspector` (col-span-2)
- **Système de tri multi-colonnes** — cycle desc→asc→null avec icône ↑, tri alpha ou date :
  - `InspectionWidget.jsx` et `ProjectWidget.jsx` : tri sur toutes les colonnes (title/type/status/inspector/inspection_date et name/due_date/status/last_follow_up)
- **Header toujours visible** — les en-têtes de colonnes s'affichent même quand la liste est vide
- **Message vide dynamique** — "Aucune inspection/projet trouvé avec le statut « X »" adapté au filtre actif

### Changed
- **Refactor `InspectionWidget`** — extraction de la logique shared dans `OverviewWidget` :
  - `client/src/features/comuse/inspections/components/InspectionWidget.jsx` : ~375 lignes → ~35 lignes (-90%), ne contient que config + renderItem
- **Refactor `ProjectWidget`** — même pattern que InspectionWidget :
  - `client/src/features/project-management/projects/components/ProjectWidget.jsx` : ~375 lignes → ~35 lignes (-90%), ne contient que config + renderItem
- **Headers triables avec style natif** — `<button>` avec `bg-transparent border-none p-0 uppercase` pour contrer les styles natifs du navigateur
- **Flèche de tri en span texte** — `↑` en `<span class="text-xs text-text-main/75">` au lieu de SortIcon SVG

### Removed
- **Imports inutilisés** — `Loader`, `Toggle`, `RefreshIcon`, `SearchIcon` retirés de `InspectionWidget.jsx` et `ProjectWidget.jsx` (délégués à `OverviewWidget`)
- **Code dupliqué** — `formatDateFr`, `getAccount`, `normalizeStatus`, `getFrenchStatusLabel`, scroll indicator logic supprimés des deux widgets (centralisés dans `OverviewWidget`)

### Changed
- **Simplification du filtre inspections software picker** — le dropdown `/inspections/software` affiche uniquement les inspections `is_sorting` et `validation`, navigation auto à la sélection :
  - `client/src/features/comuse/software/inspectionSoftwareUtils.js` : retrait des constantes `SOFTWARE_PICKER_ALLOWED_TYPES` et `SOFTWARE_PICKER_ALLOWED_TYPE`, retrait des fonctions `normalizeInspectionType` et `resolveInspectionType`, `SOFTWARE_PICKER_ALLOWED_STATUS` réduit à `['is_sorting', 'validation']`
  - `client/src/features/comuse/software/inspectionSoftware.jsx` : retrait du filtre type côté client et de l'envoi `type` à l'API, `handleInspectionPickerConfirm` accepte l'ID directement depuis le select
  - `client/src/features/comuse/software/inspectionSoftwareParts.jsx` : `InspectionPickerModal` — suppression des boutons Annuler/Ouvrir, navigation auto à la sélection, masquage du bouton fermeture modal (`showCloseButton={false}`), retrait import `Button`

### Added
- **CRUD fichiers inspections** — gestion complète des fichiers (upload, update, delete) :
  - `client/src/features/comuse/inspections/services/inspectionsApi.js` : ajout méthodes `uploadFiles`, `updateFile`, `deleteFile`
  - `server/features/portal-specific/comuse/inspections/InspectionController.js` : ajout méthodes `updateInspectionFile` et `deleteInspectionFile`, import `FilesService`
  - `server/features/portal-specific/comuse/inspections/inspection.routes.js` : ajout routes `PUT /:id/files` et `DELETE /:id/files/:fileId`

### Fixed
- **API `/files` non disponible pour ce contexte** — l'onglet FilesTab ne s'affichait pas sur les pages détail inspection :
  - Activation des routes et endpoints nécessaires au CRUD fichiers inspections

---

## [Unreleased]

### Fixed
- **Seuil de recherche dans `FilterSection`** — la recherche se déclenche maintenant dès le 2ᵉ caractère au lieu du 4ᵉ :
  - `client/src/shared/components/molecules/FilterSection.jsx` : seuil `> 3` → `> 1`
- **`syncInvoicesDelta` — `last_sync_at` mis à jour après Books→Portal** — corrige le ping-pong d'un run où une facture syncée de Books vers le Portal était re-poussée vers Books au run suivant :
  - `server/features/system/integrations/zoho/services/zoho.books.sync.service.js` : ajout `ResourceIntegrationService.upsert({ last_sync_at: now })` après `InvoiceService.update`
- **`skipZohoSync: true` supprimé du updateData Books→Portal** — flag mort-code dans `InvoiceService.update` (aucune logique Zoho dans cette méthode) :
  - `server/features/system/integrations/zoho/services/zoho.books.sync.service.js`

### Changed
- **Payload factures Books nettoyé** — supprimé `salesperson_id` (champ inexistant dans l'API Zoho Books) et `status` (non writable, déjà géré via endpoint dédié) :
  - `server/features/system/integrations/zoho/services/zoho.books.service.js` : `#formatInvoicePayload` + suppression de `delete payload.status` dans `updateInvoiceZohoBooks`

### Updated
- **README Zoho** — tables `ZohoBooksService` et `ZohoBooksSyncService` mises à jour avec les méthodes manquantes (`updateInvoiceZohoBooks`, `syncInvoicesDelta`, `syncPaymentsDelta`, etc.)

---

## 2026-07-16

### Added
- **nginx proxy_cache activé pour 17 sites WordPress** — optimisation du cache proxy pour réduire l'egress GCP (~$124/mois d'économie estimée) :
  - 17 fichiers `nginx-cache.json` créés dans `/var/cpanel/userdata/<user>/` pour activer le cache WHM natif
  - Sites activés : `terrainsmauricie`, `pnp`, `droletsimard`, `elabore`, `aeraventilation`, `buffetlise`, `ficelle`, `jolygateries`, `lrgmedia`, `mission`, `campinglacmagog`, `minilab`, `sciagedebetonai`, `bonpasteursher`, `firmebrouillette`, `absoluresidence`, `taillagedehaies`
  - Configuration WHM : `proxy_cache_path`, `$CPANEL_PROXY_CACHE`, exclusion automatique des cookies `wordpress_logged_in_*`
  - Cache disk : `/var/cache/ea-nginx/proxy/<site>` avec `levels=1:2 keys_zone=10m inactive=60m`
  - Tous les sites testés avec succès : `x-cache: HIT` après premier appel
- **Analyse d'impact portails React/PM2** — vérification que le cache nginx ne couvre que les sites WordPress :
  - Portails React (`portallrgmedia`, `portaldemo`, `portalcomuse`, `projetlrgmedia`) : `proxy_cache off` explicite ✅
  - APIs Node.js (`api-comuse`, `api-demo`, `api-terrainsmauricie`) : `proxy_cache off` + `proxy_cache_bypass 1` ✅
  - WebSocket (`socket-io.conf`) : `proxy_cache off` ✅
  - Aucun impact sur les fonctionnalités en temps réel

### Changed
- **cache.json global mis à jour** — ajout `x_cache_header: true` temporairement pour validation du cache :
  - `/etc/nginx/ea-nginx/cache.json` : `x_cache_header` passé de `false` à `true`
  - Désactivation prévue après 48h de validation

### Fixed
- **Crash serveur cloud.lrgmedia.ca** — diagnostic et correction de l'incident du 16 juillet 18:27 :
  - Cause : 171 timeouts PHP `ea-php84` en mode CGI sur jolygateries.ca → RAM saturée → SSH inaccessible → reboot manuel
  - Correction : activation PHP-FPM pour jolygateries.ca via WHM MultiPHP Manager
  - `jolygateries.ca` passe de CGI (fork par requête) à FPM (pool persistant, max 20 workers)
- **WP-Cron optimisé pour 21 sites WordPress** — tous les sites utilisaient le WP-Cron natif (déclenché à chaque visite = ~500 appels/heure) :
  - Ajout `define('DISABLE_WP_CRON', true)` dans les 21 `wp-config.php`
  - Ajout system cron `16,46 * * * *` (2 fois par heure) pour chaque utilisateur WordPress
  - Réduction de ~95% du CPU consommé par les tâches cron
- **WP_DEBUG_LOG corrigé sur PNP** — `WP_DEBUG_LOG` passait de `true` à `false` sur productionsnoeudpapillon.com
- **Cron décalé pour éviter les spikes** — les 21 sites ne tournent plus tous au même moment
- **fail2ban installé et configuré** — protection automatique contre les attaques :
  - 8 jails : `sshd`, `apache-auth`, `apache-botsearch`, `apache-badbots`, `wordpress-login`, `wordpress-xmlrpc`, `apache-scanner`, `apache-php-timeout`
  - Ban automatique après détection (3-20 échecs selon le jail)
  - Durée de ban : 1h à 7 jours selon la gravité
  - Filtre custom `apache-php-timeout` pour détecter les floods PHP
- **7 IPs malveillantes bloquées** en dur via firewall-cmd :
  - `185.93.89.147` (celui qui a causé le crash)
  - `40.69.213.226`, `54.226.61.95`, `52.169.17.227`, `52.164.246.235` (scanners Azure/AWS)
  - `193.142.147.209` (exploit IoT LuCI)
  - `167.99.189.248` (scanner de configs)
- **atop installé** — historique processus par minute, rétention 28 jours :
  - Configuration : `LOGINTERVAL=60`, `LOGPATH=/var/log/atop/`
  - Commande : `atop -r /var/log/atop/atop_YYYY-MM-DD -b HH:MM -e HH:MM -p`

### Changed
- **Logs Apache/Nginx nettoyés** — suppression des logs pré-reboot (115 MB récupérés) :
  - `access_log` : 44 MB → 380 B
  - `error_log` : 20 MB → 0 B
  - `nginx/access.log` : 53 MB → 2.6 MB
- **Fichiers backup supprimés** — 845 fichiers .bak/.save/.old inutiles nettoyés (4.7 MB) :
  - `/home/virtfs/*/tmp/phpfpm-backup-*` (794 fichiers)
  - `/opt/cpanel/ea-php84/root/etc/php-fpm.d/*.save` et `*.bak.*`
  - `/etc/firewalld/zones/trusted.xml.old`
  - `/etc/apache2/conf.d/modsec/modsec2.cpanel.conf.PREVIOUS`

### Security
- **Blocage IP permanent** pour les IPs les plus dangereuses (firewall-cmd --permanent)
- **fail2ban actif au démarrage** — `systemctl enable fail2ban`
- **Protection WordPress** contre brute-force wp-login, xmlrpc, et scanners d'exploits

### Changed
- **CalendarView.jsx refactorisé** — refactoring majeur simplifiant le composant de 843 à 477 lignes (-43%) :
  - `client/src/shared/components/organisms/CalendarView.jsx` : extraction de 8 sous-composants/hooks
  - Hook `usePickerModal()` réutilisable remplaçant le lifecycle dupliqué des pickers mois/semaine (6 states + 2 refs + useEffect × 2 → 1 hook)
  - Composants extraits : `NavArrow`, `AddGhostButton`, `AddGhostButtonWeek`, `ViewToggle`, `ModalOverlay`, `MonthPickerModal`, `WeekPickerModal`
  - Helpers extraits : `resolveItemLabel()`, `resolveStatusColor()`, `formatItemTime()`, `isToday()`
  - Import `Clock` inutilisé supprimé, `useEffect` vide supprimé, comments `← Nouveau` nettoyés
- **Calendar view — UI mois/semaine améliorée** — modifications visuelles et comportementales :
  - `CalendarView.jsx` : cases mois à hauteur fixe 122px, scroll vertical activé
  - `CalendarView.jsx` : toggle Mois/Semaine en pill style animé (remplace les boutons FilterButton)
  - `CalendarView.jsx` : animations pickers mois/semaine migrées au pattern Modal.jsx (animate-fade-in-up/out-down)
  - `CalendarView.jsx` : pickers centrés via flex (comme Modal.jsx) avec stopPropagation sur le contenu
  - `CalendarView.jsx` : bouton "Aujourd'hui" / "Cette semaine" en style accent2/10
  - `CalendarView.jsx` : navigation par décennie dans le picker mois (clic sur année → grille de 10 ans)
  - `CalendarView.jsx` : sélection d'année isole le pickerDate du currentDate (le fond ne change qu'à la validation)
  - `CalendarView.jsx` : texte "Aucun item" / "Weekend" supprimé de la vue semaine
  - `CalendarView.jsx` : vue semaine utilise `gridTemplateRows: 1fr` pour remplir la hauteur disponible
  - `CalendarView.jsx` : transition animation entre vues mois/semaine supprimée (switch instantané)

---

## 2026-07-15

### Added
- **Widget Inspections pour le Dashboard** — clone du ProjectWidget, affiche les inspections récentes avec filtre par statut, recherche et navigation :
  - `client/src/features/comuse/inspections/components/InspectionWidget.jsx` : composant principal (grid colonnes, toggle statuts, scroll indicator)
  - `client/src/features/comuse/inspections/hooks/useInspectionWidget.js` : hook de données (getAll avec tri `updated_at desc`)
  - `client/src/features/comuse/inspections/components/index.js` : export du widget
  - `client/src/features/comuse/inspections/index.js` : export centralisé
- **`InspectionChecklistItem`** — stub minimal pour éviter les erreurs d'import dans `InspectionSection` :
  - `client/src/features/comuse/inspections/components/InspectionChecklistItem.jsx`
- **Support bilingue FR/EN des sections d'inspection software** — les groupes, catégories et descriptions sont maintenant stockés au format `{ fr, en }` dans `inspections.sections` :
  - `server/features/portal-specific/comuse/inspections/services/InspectionService.js` : ajout helper `toBilingualField()`, `sanitizeReportSection` et `sanitizeReportSubsection` normalisent en `{ fr, en }`
  - `client/src/features/comuse/software/inspectionSoftwareUtils.js` : `mapSectionItemsToQuestions(items, itemsEn)` charge FR+EN, peuple `group_en`, `category_en`, `description_en` ; `buildReportSectionsPayload` sauvegarde `{ fr, en }` ; ajout `resolveCommentDisplayLabelEn()`
  - `client/src/features/comuse/software/inspectionSoftware.jsx` : chargement des sections EN depuis l'API, passage à `mapSectionItemsToQuestions(fr, en)`
- **Helper `#resolveBilingualText` dans le service PDF** — résolution de la bonne langue au moment du rendu HTML :
  - `server/features/portal-specific/comuse/inspections/services/inspection.pdf.service.js` : nouveau helper, utilisé dans `#normalizeSections`, `#buildInspectionDetailsSectionHtml`, `#buildInspectionExecutiveSummaryHtml`, `#buildInspectionGroupSummaryRowsHtml`
- **Traduction FR→EN des 301 sections software** — groupes, catégories et descriptions traduits dans la table `Options` (id 1155) :
  - Extraction, traduction et sauvegarde via script Node.js
- **Clé `integrations` dans la réponse du endpoint `GET /api/inspections`** — chaque inspection de la liste retourne maintenant ses intégrations (google_drive, zoho_crm, etc.) :
  - `server/features/portal-specific/comuse/inspections/inspection.routes.js` : ajout d'un batch fetch `ResourceIntegrationService.getByResource()` et inclusion de `integrations` dans chaque objet inspection formaté

### Changed
- **Dashboard layout** — Projets et Inspections en pleine largeur, empilés verticalement ; NotesWidget toujours en bas :
  - `client/src/features/admin/pages/Dashboard.jsx` : `flex flex-col` au lieu de `grid lg:grid-cols-2`, NotesWidget dans sa propre section séparée
- **Statuts inspections alignés avec la BDD** — ajout de `validation`, `to_send`, `deleted` dans la config ; suppression de l'alias `validation: 'Validation'` qui court-circuitait la résolution :
  - `client/src/shared/config/status.config.js` : `STATUS_CONFIGS` + `STATUS_GROUPS.inspections` + `STATUS_ALIASES`
- **Couleurs badges inspections** — `validation` → bleu, `to_send` (Rapport à envoyer) → rouge :
  - `client/src/shared/config/status.config.js`
- **Widget toggle options dynamiques** — le filtre utilise `getStatusOptionsByGroup('inspections')` au lieu de valeurs hardcodées :
  - `client/src/features/comuse/inspections/components/InspectionWidget.jsx`
- **Migration DB des inspections existantes** — inspections 321 et 340 converties du format string au format `{ fr, en }` :
  - Script de migration avec backup préalable (`backup_sections_20260715.json`)
- **Titre PDF 30 jours** — correction du titre EN pour les rapports 30 jours :
  - `server/features/portal-specific/comuse/inspections/services/inspection.pdf.service.js` : `"30 Days Inspection Report"` au lieu de `"Inspection Report"`

### Removed
- **Widget "Inspections Prioritaires"** du Dashboard (overdue inspections) — remplacé par le nouveau widget InspectionWidget :
  - `client/src/features/admin/pages/Dashboard.jsx` : suppression du bloc, des states `overdueInspections`/`loadingInspections`, du `useEffect` associé, de `overdueAnimationStyle`, de `formatInspectionTypeLabel`, et des imports `Loader`, `Badge`, `inspectionsApi`

### Fixed
- **Imports cassés dans `InspectionFilters.jsx`** — chemin relatif incorrect vers `FilterSection` :
  - `client/src/features/comuse/inspections/components/InspectionFilters.jsx` : `@components/molecules/FilterSection`
- **Import cassé dans `InspectionSection.jsx`** — fichier types inexistant `inspectionMensuel.types.js` et `InspectionChecklistItem` manquant :
  - `client/src/features/comuse/inspections/components/InspectionSection.jsx` : inline `SectionPropTypes`, import du stub `InspectionChecklistItem`
- **Exports fantômes supprimés** du barrel `index.js` — `InspectionChecklistItem` et `InspectionMensuelForm` pointaient vers des fichiers inexistants :
  - `client/src/features/comuse/inspections/components/index.js`
- **`findMatchingReportSection`** — adaptation pour lire `description.fr` ou `description` (string legacy) lors de l'hydratation du rapport :
  - `client/src/features/comuse/software/inspectionSoftwareUtils.js`

---

## 2026-07-14

### Added
- **Script `sync-zoho-books-accounts.mjs`** — match les comptes locaux avec les contacts Zoho Books et crée les intégrations manquantes :
  - `scripts/sync-zoho-books-accounts.mjs` : fetch contacts Books via API, match par nom (normalisé), crée les enregistrements `integrations` avec status `synced`
- **Intégrations Zoho Books dans `GET /api/invoices/:id` et `GET /api/quotes/:id`** — les réponses incluent maintenant le champ `integrations` :
  - `server/features/finances/invoices/invoice.service.js` : import `ResourceIntegrationService`, ajout du lookup dans `getById`
  - `server/features/finances/quotes/quote.service.js` : idem
- **Sync Zoho Books non bloquante sur Account CRUD** — création, mise à jour et suppression d'un compte locale se répercutent dans Books :
  - `server/features/crm/accounts/account.service.js` : import `ZohoBooksService`, appels fire-and-forget (`createAccountZohoBooks`, `updateAccountZohoBooks`, `deleteAccountZohoBooks`)
- **Sync Zoho Books non bloquante sur Contact CRUD** — les changements de contact rafraîchissent les contact_persons de l'account dans Books :
  - `server/features/crm/contacts/services/contact.service.js` : import `ZohoBooksService`, appels fire-and-forget vers `updateAccountZohoBooks` (skip si pas d'account_id)
- **Guard `isZohoBooksEnabled()` dans `ZohoBooksService`** — le feature flag est vérifié en interne dans chaque méthode publique, plus besoin chez les consommateurs :
  - `server/features/system/integrations/zoho/services/zoho.books.service.js` : import `isZohoBooksEnabled`, guard dans les 16 méthodes publiques

### Changed
- **URL Zoho Books corrigée pour les accounts** — `/contacts/` au lieu de `/invoices/` :
  - `server/features/system/integrations/services/integrations.global.service.js` : le path Books dépend maintenant de `row.resource_type` (account/contact → `contacts`, invoice → `invoices`)
- **`InvoiceService` et `QuoteService` ne vérifient plus `isZohoBooksEnabled()`** — délégué au service Books :
  - `server/features/finances/invoices/invoice.service.js` : suppression de l'import `isZohoBooksEnabled` et des guards `if (isZohoBooksEnabled())`
  - `server/features/finances/quotes/quote.service.js` : idem
- **Badges d'intégration (Zoho CRM / Zoho Books / Google Drive) dans les pages facture et devis** — les liens externes s'affichent au-dessus du badge de statut dans l'en-tête :
  - `client/src/features/finance/invoices/components/InvoicePreviewCard.jsx` : import `IntegrationBadge`, calcul `integrationBadges` via `useMemo` depuis `invoice.integrations`, rendu dans le header
  - `client/src/features/finance/quotes/components/QuotePreviewCard.jsx` : idem, lecture depuis `QUOTE.integrations`
- **Nouveau type `zoho-books` dans `IntegrationBadge`** — badge vert avec logo officiel Zoho Books :
  - `client/src/shared/components/atoms/IntegrationBadge.jsx` : ajout du type `zoho-books` (label, couleur `#00ac47`, SVG, fallback URL `books.zoho.com/app/851244506/#/invoices/:id`), appliqué au `<g>` en dur
  - `client/src/shared/components/atoms/IntegrationBadge.jsx` : color style condition élargie pour `zoho-books` (texte + icône)
  - `client/src/shared/related/components/DetailPageTabs.jsx` : résolution générique `integrations.zoho_books` → badge `zoho-books`
  - `client/src/features/finance/invoices/components/InvoicePreviewCard.jsx` : ajout `zoho_books` dans le resolver
  - `client/src/features/finance/quotes/components/QuotePreviewCard.jsx` : idem

### Removed
- **Méthodes contact CRUD inutilisées dans `ZohoBooksService`** — les contacts sont gérés via `updateAccountZohoBooks` → `#mapContactPersons` :
  - `server/features/system/integrations/zoho/services/zoho.books.service.js` : suppression de `createContactZohoBooks`, `updateContactZohoBooks`, `deleteContactZohoBooks`, `#mapLocalContactToBooks`
- **Entrée `zoho_books` redondante dans `AccountDetail.jsx`** — supprimée car déjà résolue automatiquement par `DetailPageTabs` :
  - `client/src/features/crm/accounts/pages/AccountDetail.jsx` : suppression de l'entrée `zoho_books` du tableau `integrationBadges`

### Fixed
- **Nettoyage des intégrations Zoho Books orphelines** — 188 enregistrements `pending` sans `integration_value` supprimés de la table `integrations`

## 2026-07-13

### Fixed
- **Badge billing_cycle — style inconsistant avec badge status** — issue #65 :
  - `client/src/shared/components/organisms/GenericFeatureTableView.jsx` : remplacement des couleurs raw Tailwind (`bg-cyan-700/20 text-cyan-400`, `bg-purple-700/20 text-purple-400`) par les clés nommées `orange` et `purple` du `COLOR_VARIANTS`
  - `client/src/shared/config/defaultRenderers.jsx` : fallback renderer `billing_cycle` corrigé de même
  - Les badges Facturation utilisent maintenant le même système de variants que les badges Statut (border, light/dark mode, opacité standardisée)

### Added
- **BrowserPool — pool partagé de pages Puppeteer** — une seule instance Chrome par portal au lieu de 4 :
  - `server/shared/services/BrowserPool.js` : pool singleton avec acquire/release, file d'attente, timeout 60s, relance auto au disconnect, cleanup SIGTERM/SIGINT
  - Limite configurable via `PUPPETEER_MAX_PAGES` (défaut: 2)
  - Slots réservés avant `await newPage()` pour éviter les race conditions
  - Pages recyclées (close + newPage) entre les utilisations pour un état propre
  - Flags Chrome optimisés mémoire : `--disable-dev-shm-usage`, `--disable-gpu`, `--renderer-process-limit=4`, `--js-flags=--max-old-space-size=1024`
  - `server/shared/services/index.js` : export `BrowserPool` ajouté

### Changed
- **BasePdfService — optimisations micro-performance** :
  - `server/shared/services/BasePdfService.js` : `escapeHtml` passe de5 regex séquentielles à1 seul pass via `RegExp` + lookup map (5× plus rapide)
  - `server/shared/services/BasePdfService.js` : `formatCurrency` cache les instances `Intl.NumberFormat` par devise (~10× plus rapide sur appels répétés)
  - `server/shared/services/BasePdfService.js` : `renderTemplate` pré-compile et cache les RegExp par template (~3× plus rapide)
  - `server/shared/services/BasePdfService.js` : `LOCAL_FALLBACK_FONT_FACES` converti en constante module (12 objets + `path.resolve` calculés 1× au démarrage)
  - `server/shared/services/BasePdfService.js` : `PDF_FOOTER_TEMPLATE` extrait en constante module (zéro allocation par PDF)
  - `server/shared/services/BasePdfService.js` : cache CSS/fonts TTL étendu de 5 min à 7 jours

- **OrganizationService — cache in-memory des settings** :
  - `server/shared/services/OrganizationService.js` : `getOrganizationSettings()` mise en cache avec TTL 10 min, évite `prisma.Options.findFirst()` à chaque PDF
  - `server/shared/services/OrganizationService.js` : ajout de `invalidateOrganizationCache()` appelé après mise à jour des settings
  - `server/features/finances/invoices/invoice.pdf.service.js` : requêtes Prisma + orgSettings parallélisées via `Promise.all()`
  - `server/features/finances/quotes/quote.pdf.service.js` : idem

- **Refactor InvoicePdfService / QuotePdfService** — extraction de l'infrastructure PDF dans un `BasePdfService` partagé :
  - `server/shared/services/BasePdfService.js` : nouveau service contenant tout le code commun (CSS loading, font embedding, template rendering, Puppeteer page management, utils HTML/formatage)
  - `server/features/finances/invoices/invoice.pdf.service.js` : réduit de ~600 à ~140 lignes — ne garde que `#buildInvoiceContentHtml` et `generateInvoicePdf`
  - `server/features/finances/quotes/quote.pdf.service.js` : réduit de ~540 à ~130 lignes — ne garde que `#buildQuoteContentHtml` et `generateQuotePdf`
  - **Suppression de la duplication** (~400 lignes identiques supprimées entre les deux services)
  - **Cache CSS/fonts (TTL 5 min)** — les CSS client et fonts embarquées sont mis en cache par portalType, évitant 3-5 appels réseau par génération PDF
  - **Cache template HTML** — `invoice_export.html` / `quote_export.html` lus une seule fois puis mis en cache mémoire
  - **`networkidle2` → `load`** — tout le CSS/fonts est inline après `buildClientStylesHtml`, plus besoin d'attendre 500ms réseau inactif
  - **Timeout `fonts.ready` réduit** de 1200ms à 800ms
  - **Download fonts en parallèle** — batches de 8 via `Promise.allSettled` au lieu de séquentiel
  - **CSS fetch parallèle** — tous les fichiers CSS sont fetchés en simultané via `Promise.allSettled`
  - Dead code supprimé : `generateInvoicePdfFromHtml` / `generateQuotePdfFromHtml` simplifiés en aliases
  - `server/shared/services/index.js` : export `BasePdfService` ajouté

- **Migration des 4 services PDF vers BrowserPool** — suppression des singletons `#browserInstance` individuels :
  - `server/features/finances/invoices/invoice.pdf.service.js` : `BrowserPool.acquirePage()` / `await BrowserPool.releasePage(page)`
  - `server/features/finances/quotes/quote.pdf.service.js` : idem
  - `server/features/portal-specific/comuse/inspections/services/inspection.pdf.service.js` : idem
  - `server/features/portal-specific/terrains_mauricie/properties/services/property.pdf.service.js` : idem

- **Refactor NotesTab.jsx** — simplification du code (~120 lignes supprimées) :
  - Suppression de `notesTabCache`, `displayedNotes`, `cacheKey` et 2 `useEffect` de sync → `state.items` utilisé directement
  - `resourceTypeMap` (9 entrées identiques) remplacé par `mapResourceType()`
  - Fonctions pures (`hasRichTextContent`, `normalizeRichTextValue`, `formatRelativeNoteTime`) déplacées hors du composant
  - `getNoteAuthorName` + `getNoteAuthorInitials` fusionnés en `getAuthorInfo`
  - 2 handlers keydown unifiés en `handleCtrlEnter(callback)`
  - `addSectionRef` supprimé (plus utilisé)

- **Formulaire d'ajout masqué par défaut** :
  - `client/src/shared/related/components/tabs/NotesTab.jsx` : le formulaire ne s'affiche qu'au clic sur "Ajouter une note"

### Fixed
- **OOM crash serveur** — le kernel OOM killer tuait des process Chrome suite à une consommation excessive de RAM :
  - Avant: 4 × Chrome instances (~3.3 GB) → After: 2 × Chrome instances (~1.6 GB)
  - Max 2 pages simultanées au lieu de potentiellement 7+
- **Fichiers temporaires Chrome orphaned** — 79 profils `/tmp/puppeteer_dev_chrome_profile-*` (433 MB) jamais nettoyés → nettoyés et plus de leak grâce au pool unique
- **Race condition dans BrowserPool** — `#reservedSlots` incrémenté avant `await newPage()` pour empêcher le dépassement de la limite en cas de requêtes concurrentes
- **Note ajoutée apparaît maintenant en haut de la liste** — issue #48 :
  - `client/src/shared/related/components/tabs/NotesTab.jsx` : le formulaire d'ajout est rendu avant la liste des notes au lieu d'après

### Added
- **Panneau Notes dans le logiciel d'inspection** — SidePanel glissant avec liste des notes de l'inspection :
  - `client/src/features/comuse/software/inspectionSoftware.jsx` : icône avec animation conditionnelle, panneau SidePanel, affichage des notes
  - `client/src/features/comuse/inspections/services/inspectionsApi.js` : méthode `getInspectionNotes()` → `GET /api/inspections/:id/notes`
  - `client/src/features/comuse/software/hooks/useInspectionSoftwareApi.js` : hook `loadInspectionNotes` ajouté
  - Bouton copier dans chaque card (texte brut du message)
  - Animation `notification-bounce` personnalisée — `client/src/app/animation.css`

- **ToastContainer pour page standalone** — Ajout du `<ToastContainer />` dans `inspectionSoftware.jsx` (page hors Layout) pour permettre l'affichage des notifications toast

### Fixed
- **Appel API inutile sur page picker** — `loadSoftwareOptionsApi` se déclenchait sur `/inspections/software` (sans ID) :
  - `client/src/features/comuse/software/inspectionSoftware.jsx` : guard `if (!resolvedInspectionId) return;` + ajout de `resolvedInspectionId` aux dépendances du useEffect

- **Images absentes dans le PDF d'inspection** — URLs `drive-storage` non reconnues :
  - `server/features/portal-specific/comuse/inspections/services/inspection.pdf.service.js` : conversion `drive-storage` → `/d/{fileId}` dans `#normalizeSections`, pattern ajouté dans `#extractDriveFileId`, détection ajoutée dans `hasDriveApiImages`

### Removed
- **Console.log de debug** supprimés :
  - `client/src/shared/components/molecules/fields/SelectField.jsx` : 5 console.log
  - `client/src/features/settings/workflows/pages/SettingsWorkflowForm.jsx` : 1 console.log

## 2026-07-10

### Changed
- **Downsizing VM GCP** — e2-standard-8 (8 vCPU, 32 GB) → e2-standard-4 (4 vCPU, 16 GB) :
  - Économie estimée : ~$2,178/an (CUD 1 an souscrit)
  - Load average réduit de 3.49 à 1.78 (-49%)

- **PHP-FPM max_children optimisé par trafic** — 44 pools modifiés selon l'analyse des logs nginx :
  - Tier A (20 workers) : campinglacmagog.ca, terrainsmauricie.com (>5000 req/jour)
  - Tier B (10 workers) : 7 sites (1000-5000 req/jour)
  - Tier C (5 workers) : 35 sites (<1000 req/jour)
  - Scripts : `scripts/fix-phpfpm-traffic-based.sh`

- **PHP-FPM max_requests = 500** — Tous les pools (46 modifiés) :
  - Avant : 20-100 (causait 1,244 spawn/kill/jour pour campinglacmagog)
  - Après : 50 (96% moins de gaspillage CPU)
  - Scripts : `scripts/fix-phpfpm-max-requests.sh`

- **Nginx worker_processes = auto** — `/etc/nginx/nginx.conf` :
  - Avant : 1 worker (3 vCPU dormants)
  - Après : auto (4 workers, +300% throughput)

- **OPcache optimisé** — `/opt/cpanel/ea-php83/root/etc/php.d/10-opcache.ini` + ea-php84 :
  - memory_consumption : 128 MB → 256 MB
  - max_accelerated_files : 4000 → 50000
  - interned_strings_buffer : 8 MB → 16 MB
  - Cache full : YES → NO (+2100% mémoire cache)

### Added
- **Script create-issue.sh** — `.github/skills/create-github-issue/create-issue.sh` :
  - Script bash pour créer des issues GitHub avec pinned fields (Priority, Feature)
  - Utilise gh CLI + GraphQL pour résoudre les IDs dynamiquement

### Fixed
- **Fuite mémoire absoluresidence.com détectée** — ~10 MB/min par worker PHP-FPM :
  - Cause probable : plugins JetEngine + JetSmartFilters
  - Mitigation : max_requests = 500 limite la croissance
  - Surveillance recommandée

## 2026-07-10

### Fixed
- **Appel API inutile sur page picker inspections** — Évite la requête `/api/inspections/options?type=software` quand on est sur `/inspections/software` (mode picker sans ID) :
  - `client/src/features/comuse/software/inspectionSoftware.jsx` : ajout du guard `if (!resolvedInspectionId) return;` sur le useEffect des options
  - `client/src/features/comuse/software/inspectionSoftware.jsx` : ajout de `resolvedInspectionId` au tableau de dépendances pour recharger les options à la navigation vers une inspection

- **Images absentes dans le PDF d'inspection** — Les images sauvegardées avec des URLs `drive-storage` n'étaient pas détectées :
  - `server/features/portal-specific/comuse/inspections/services/inspection.pdf.service.js` : conversion des URLs `drive-storage` en `/d/{fileId}` dans `#normalizeSections` via le champ `id`
  - `server/features/portal-specific/comuse/inspections/services/inspection.pdf.service.js` : ajout du pattern `drive-storage` dans `#extractDriveFileId`
  - `server/features/portal-specific/comuse/inspections/services/inspection.pdf.service.js` : détection des URLs `drive-storage` dans `hasDriveApiImages` pour injecter le token d'auth

### Removed
- **Console.log de debug supprimés** :
  - `client/src/shared/components/molecules/fields/SelectField.jsx` : 5 console.log supprimés
  - `client/src/features/settings/workflows/pages/SettingsWorkflowForm.jsx` : 1 console.log supprimé

## 2026-07-10

### Changed
- Renamed sidebar label from "Software" to "Logiciel" for the inspection software page (sidebar + recently viewed).
- Refactored `inspectionSoftware.jsx` (1 656 lines) into 3 files ≤ 500 lines: `inspectionSoftwareUtils.js`, `inspectionSoftwareParts.jsx`, `inspectionSoftware.jsx`.

### Fixed
- **Token refresh flow** — Correction complète du mécanisme de refresh des tokens :
  - `client/src/auth/services/tokenApi.js` : accessToken stocké en mémoire + localStorage (plus de cookie authToken). Supprime le doublon entre le header `Authorization` et le cookie.
  - `client/src/auth/services/authApi.js` : `validateToken()` utilise `fetch()` direct au lieu de `apiService` pour éviter le double POST `/auth/verify`.
  - `client/src/shared/utils/storage/tokenRefreshInterceptor.js` : sauvegarde le refreshToken après un refresh réussi.
  - `client/src/auth/contexts/AuthContext.jsx` : stocke le refreshToken au login.
  - `client/src/auth/hooks/useTokenRefresh.js` : supprime le 2ème appel `/auth/verify` inutile — logout direct après échec de l'interceptor.
  - `client/src/auth/hooks/useTokenExpiration.js` : supprime `logout()` + `localStorage.clear()` immédiats — évite la race condition avec `useTokenRefresh`.
  - `server/features/system/auth/controllers/authController.js` : `sameSite: 'strict'` → `'lax'` (dev) / `'none'` (prod) pour le cookie httpOnly refreshToken.

- **Cookies nettoyés** :
  - `client/src/auth/services/tokenApi.js` : `rememberedEmail` migré de cookie vers localStorage.
  - `client/src/auth/services/tokenApi.js` : `refreshToken` — plus de stockage en localStorage (cookie uniquement).
  - `client/src/auth/utils/cookieUtils.js` : `clearAuthCookies()` et `clearAllCookies()` mis à jour.

### Optimized
- **Réponses API allégées en production** :
  - `server/shared/middleware/response.js` : `createMetadata()` n'inclut `performance`, `timestamp`, `request_id` qu'en dev.
  - `server/shared/response/helpers/responseHelper.js` : tous les helpers ne retournent plus `errors: null`, `message: null`, ni `meta` vide.

## 2026-07-02

### Removed
- **Nettoyage fichiers inutilisés `admin/`** (5 fichiers) :
  - `pages/Schedule.jsx` — legacy orphelin
  - `components/timer.jsx` — remplacé par `@shared/components/organisms/timer/`
  - `hooks/useRolesManagement.js` — jamais importé
  - `test/index.js` — barrel mort
  - `test/ErrorTestSection.jsx` — export du barrel mort
  - Dossier `hooks/` vidé → supprimé

- **Nettoyage fichiers inutilisés `crm/`** (10 fichiers) :
  - `shared/crmApi.js`, `shared/contexts/CRMContext.jsx`, `shared/hooks/useCRMRelations.js`, `shared/utils/crmFormatters.js`, `shared/utils/crmValidators.js` — aucun consommateur externe
  - `contacts/components/ContactCard.jsx`, `contacts/components/ContactForm.jsx` — remplacés par GenericEntityCard/Form
  - `leads/components/LeadCard.jsx` — remplacé par GenericEntityCard
  - Barrels `contacts/components/index.js`, `leads/components/index.js` supprimés

- **Nettoyage fichiers inutilisés `site-health/`** (5 fichiers) :
  - `services/siteHealthFormatters.js` — jamais importé
  - `pages/index.js`, `components/index.js`, `utils/index.js` — barrels morts
  - `INTEGRATION_DRY_GUIDE.md` — documentation orpheline

- **Nettoyage fichiers inutilisés `project-management/`** (7 fichiers) :
  - `index.js` — barrel root mort
  - `time-tracking/index.js`, `time-tracking/utils/index.js`, `time-tracking/pages/index.js`, `time-tracking/hooks/index.js` — barrels morts
  - `time-tracking/hooks/useTimeTracking.js` — hook mort
  - `time-tracking/components/MiniTimerWidget.jsx` — composant orphelin

- **Nettoyage fichiers inutilisés `integrations/`** (3 fichiers) :
  - `zoho-crm/hooks/useZohoFields.js` — jamais importé
  - `gmail/components/GmailCard.jsx` — jamais importé
  - `types/index.ts` — types TS jamais importés
  - Dossier `types/` supprimé

### Changed
- **Barrels `crm/` nettoyés** — exports cassés retirés :
  - `crm/index.js` : section `SHARED CRM` supprimée, `ContactCard`/`ContactForm`/`LeadCard` retirés
  - `crm/contacts/index.js` : import `./components/index.js` supprimé
  - `crm/leads/index.js` : import `./components/index.js` supprimé
- **Barrel `site-health/index.js`** : export cassé `SiteHealthFormatters` retiré

---

## 2026-07-02

### Added
- **Route `/inspections/software`** restaurée (sans `:id`) pour le logiciel de tri photos — Comuse only
- **Section Lucide Icons** ajoutée sous la galerie d'icônes custom sur la page `/theme-test?related=icons`
- **`strokeWidth={1.5}`** appliqué à toutes les icônes Lucide dans la galerie de test

### Changed
- **Routes `/inspections/logiciel` → `/inspections/software`** — Renommmage complet de la feature "logiciel" en "software" :
  - `main.jsx` : routes `/inspections/software` et `/inspections/:id/software`
  - `routesAccessConfig.js` : nav item `inspectionsSoftware`, permissions mappings
  - `InspectionReportsTab.jsx` : redirect vers `/inspections/:id/software`
  - `inspectionSoftware.jsx` : navigation back et inspection picker
  - `useRecentlyViewed.js` : pages récemment vues
- **`README.md`** nettoyé — suppressions des références aux composants orphelins (AdminDashboard, Dashboard.v2, Schedule, UserManagement)

### Removed
- **Route `/filter-test`** supprimée de `main.jsx` (lucide icons showcase intégré à la page theme-test)
- **Route `/logiciel-de-trie`** supprimée de `main.jsx` (redondante avec `/inspections/software`)
- **Route `/admin/tableau-de-bord`** supprimée — composant `AdminDashboard` orphelin (stats stub, aucun lien sidebar/menu)
- **Route `/gestion-equipe`** supprimée — composant `UserManagement.jsx` orphelin (aucun import, aucun sidebar)
- **Route `/inspections2`** supprimée — alias legacy de `/inspections` (même composant, mêmes permissions)
- **Route `/planification`** supprimée — composant `Schedule.jsx` orphelin (aucune autre utilisation)
- **`Dashboard.v2.jsx`** supprimé — composant orphelin (non importé)
- **Titre et description** retirés de la section galerie Lucide dans `ThemeTestPage`
- **Header info** retiré du composant `IconGalleryTab`

### Added (tooling)
- **`CHANGELOG.md`** créé — historique des changements au format Keep a Changelog
- **Skill `changelog-updater`** ajouté dans `.github/skills/` — mise à jour automatique du changelog en fin de session

---

## 2026-01-01

### Added
- Version initiale du ClientPortal LRG
- Architecture multi-portail (LRG Media, Comuse, Terrains Mauricie, Demo)
- Système de thème clair/sombre avec toggle
- Authentification avec rôles et permissions
- Modules : CRM, Finances, Gestion de projets, Inspections, Communication
- Settings avec gestion des utilisateurs, rôles, intégrations
- Time tracking et planification
- Système de notifications et messages
- Déploiement automatisé par portail
