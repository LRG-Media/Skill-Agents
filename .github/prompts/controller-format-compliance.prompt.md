---
name: controller-format-compliance
description: Valide qu'un controller respecte le format standard (5 helpers + static methods + res.successResponse)
keywords: ["controller", "format", "code-review", "backend", "architecture"]
---

# 🎮 Vérification Format Controller Standard

## 📁 Structure de Localisation

Les controllers doivent être placés **à la racine du dossier feature** (pas dans `/controllers/`), **MÊME S'IL N'Y A QU'UN SEUL CONTROLLER**:

```
server/features/
├── backups/
│   ├── BackupController.js          ✅ À LA RACINE (même si seul ctrl)
│   ├── services/
│   │   └── BackupService.js
│   ├── routes/
│   │   └── backupRoutes.js
│   ├── index.js
│   └── permissions/
├── auth/
│   ├── AuthController.js            ✅ À LA RACINE (même si seul ctrl)
│   ├── services/
│   │   └── AuthService.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── index.js
│   └── permissions/
├── tasks/
│   ├── TaskController.js            ✅ À LA RACINE (même si seul ctrl)
│   ├── services/
│   ├── routes/
│   └── index.js
```

**🚨 RÈGLE ABSOLUE:** Pas de dossier `/controllers/` même avec un seul controller!

## Instruction

Analyse ce controller en détail pour vérifier qu'il respecte le **FORMAT STANDARD** du projet.

## Format Standard Obligatoire

Chaque controller DOIT avoir cette structure exacte:

```javascript
export class NameController {
  
  // 1️⃣ HELPER: Extract context
  static #getContext(req) {
    return {
      portal: req.portal || 'lrgmedia',
      userId: req.user?.id,
      user: req.user
    };
  }

  // 2️⃣ HELPER: Validate ID
  static #validateId(id) {
    const numId = parseInt(id);
    if (!id || isNaN(numId)) throw new Error('ID invalide');
    return numId;
  }

  // 3️⃣ HELPER: Create metadata
  static #createMeta(context, extras = {}) {
    return {
      portal: context.portal,
      user_id: context.userId,
      ...extras
    };
  }

  // 4️⃣ HELPER: Handle errors
  static #handleError(res, operation, error, userId, id = null) {
    Logger.error('FEATURE', `Erreur ${operation}`, {
      ...(id && { resource_id: id }),
      error: error.message,
      user_id: userId
    }, error);
    
    return res.errorResponse([{ 
      code: 'ERROR_CODE', 
      message: error.message 
    }], 'Message d\'erreur', 500);
  }

  // 5️⃣ HELPER: Execute operation (RECOMMANDÉ)
  static async #executeOperation(req, res, operation, serviceMethod, successMessage, options = {}) {
    try {
      const context = this.#getContext(req);
      const id = options.validateId ? this.#validateId(req.params.id) : null;
      const result = await serviceMethod(context, id, req);
      
      const responseOptions = {
        ...(options.cache && { cache: true, cacheTTL: 300 }),
        ...(options.statusCode && { statusCode: options.statusCode }),
        meta: this.#createMeta(context, { ...(id && { resource_id: id }), ...options.extraMeta })
      };
      
      return options.isList 
        ? res.listResponse(result.items || result, result.pagination, responseOptions)
        : res.successResponse(result, successMessage, responseOptions);
    } catch (error) {
      return this.#handleError(res, operation, error, req.user?.id, req.params?.id);
    }
  }

  // 6️⃣ PUBLIC METHODS (toutes arrow functions static)
  static getAll = async (req, res) => {
    return this.#executeOperation(req, res, 'récupération liste',
      (context) => NameService.getAll(context), 'Récupération réussie',
      { isList: true, cache: true }
    );
  };

  static getById = async (req, res) => {
    return this.#executeOperation(req, res, 'récupération détail',
      (context, id) => NameService.getById(id, context), 'Ressource récupérée',
      { validateId: true }
    );
  };
}
```

## Checklist de Conformité

Vérifier chaque point:

- [ ] **Export:** `export class NameController { }`
- [ ] **Helper 1:** `static #getContext(req)` avec return {portal, userId, user}
- [ ] **Helper 2:** `static #validateId(id)` avec parseInt check
- [ ] **Helper 3:** `static #createMeta(context, extras)` avec portal + user_id
- [ ] **Helper 4:** `static #handleError(res, operation, error, userId, id)` avec Logger.error()
- [ ] **Helper 5:** `static async #executeOperation(...)` avec try/catch
- [ ] **Méthodes:** Toutes des **arrow functions static** - `static methodName = async (req, res) => {}` (PAS `static async methodName(req, res) {}`)
- [ ] **Réponses:** Utilise `res.successResponse()`, `res.errorResponse()`, `res.listResponse()`
- [ ] **Logging:** Via `Logger.info()`, `Logger.error()` (PAS `console.log`)
- [ ] **Sections:** Divisées par commentaires `// ═══ SECTION ═══`
- [ ] **Imports:** Classe Service, Logger, routes appropriées
- [ ] **Localisation:** Fichier `NameController.js` à la racine `/features/(featurename)/` (PAS dans `/controllers/`)

## Imports Corrects

### 📍 Localisation + Adaptation des Imports

Quand vous **déplacez un controller** de `/controllers/FeatureController.js` vers `/FeatureController.js`, les imports changent dans TOUS les fichiers:

### 1️⃣ Dans `routes/featureRoutes.js`:

```javascript
// ❌ AVANT (ancien):
import { FeatureController } from '../controllers/FeatureController.js';

// ✅ APRÈS (nouveau):
import { FeatureController } from '../FeatureController.js';
```

### 2️⃣ Dans `index.js` du feature:

```javascript
// ❌ AVANT (ancien):
export { FeatureController } from './controllers/FeatureController.js';

// ✅ APRÈS (nouveau):
export { FeatureController } from './FeatureController.js';
```

### 3️⃣ Si importé ailleurs dans le projet:

```javascript
// ❌ AVANT (ancien):
import { FeatureController } from './features/feature/controllers/FeatureController.js';
import { FeatureController } from '../features/feature/controllers/FeatureController.js';

// ✅ APRÈS (nouveau):
import { FeatureController } from './features/feature/FeatureController.js';
import { FeatureController } from '../features/feature/FeatureController.js';
```

### 4️⃣ Depuis index.js du feature (préféré):

```javascript
// ✅ BON (réutilisable):
import { FeatureController } from './features/feature/index.js';
// ou raccourci:
import { FeatureController } from './features/feature/';
```

### ⚠️ Pattern À Chercher (Ancien):

```javascript
// ❌ À REMPLACER:
from '../controllers/FeatureController.js'
from './controllers/FeatureController.js'
from '../../features/feature/controllers/FeatureController.js'
```

## Étapes d'analyse

1. **Structure:** Vérifier que c'est une classe avec `export class`
2. **Helpers:** Scanner les 5 helpers privés obligatoires
3. **Méthodes:** Vérifier que toutes sont `static`
4. **Réponses:** Chercher `res.successResponse()`, `res.errorResponse()`, `res.listResponse()`
5. **Logging:** Vérifier absence de `console.log` et utilisation de `Logger`
6. **Export:** Confirmer `export class NameController`

## Output Attendu

### ✅ SI CONFORME:
```
✅ CONTROLLER CONFORME

Classe: NameController
Helpers:
  ✅ #getContext() présent
  ✅ #validateId() présent
  ✅ #createMeta() présent
  ✅ #handleError() présent
  ✅ #executeOperation() présent

Méthodes (static):
  ✅ getAll()
  ✅ getById()
  ✅ create()
  ✅ update()
  ✅ delete()

Réponses:
  ✅ res.successResponse() utilisée
  ✅ res.errorResponse() utilisée
  ✅ res.listResponse() utilisée

Logging:
  ✅ Logger.error() utilisé
  ✅ Pas de console.log détecté

Statut: CONFORME ✅
```

### 🟡 SI PARTIELLEMENT CONFORME:
```
🟡 CONTROLLER PARTIELLEMENT CONFORME

Classe: NameController ✅
Helpers présents:
  ✅ #getContext()
  ✅ #validateId()
  ❌ MANQUE: #createMeta()
  ✅ #handleError()
  ❌ MANQUE: #executeOperation()

Méthodes (static):
  ✅ getAll()
  ❌ PROBLÈME: getById() n'est pas static (async getById(req, res) au lieu de static async)
  ✅ create()

Réponses:
  ✅ res.successResponse() utilisée
  ⚠️ res.json() détecté à ligne 45 (À REMPLACER par res.successResponse())

Logging:
  ✅ Logger.error() utilisé
  ✅ Pas de console.log

Statut: PARTIELLEMENT CONFORME - À CORRIGER
```

### ❌ SI NON-CONFORME:
```
❌ CONTROLLER NON-CONFORME

Fichier: authController.js
Type: Export de fonctions individuelles (LEGACY)
  export const loginUser = async (req, res) => {}
  export const verifyToken = async (req, res) => {}

Problèmes:
  ❌ PAS DE CLASSE (export const functions)
  ❌ MANQUE: #getContext() 
  ❌ MANQUE: #validateId()
  ❌ MANQUE: #createMeta()
  ❌ MANQUE: #handleError()
  ❌ MANQUE: #executeOperation()
  ⚠️ res.json() utilisé au lieu de res.successResponse()
  ⚠️ console.log détecté à ligne 23

Action requise: CONVERSION VERSION 2.0 en classe standard

Statut: NON-CONFORME ❌
```

## Erreurs Courantes À Repérer

❌ **ERREUR 0:** Mauvaise localisation du fichier
```javascript
// ❌ MAUVAIS:
/server/features/backups/controllers/BackupController.js

// ✅ BON:
/server/features/backups/BackupController.js
```

❌ **ERREUR 1:** Méthodes non-statiques
```javascript
// MAUVAIS:
async getAll(req, res) { }

// BON:
static async getAll(req, res) { }
```

❌ **ERREUR 2:** Helper manquant
```javascript
// MANQUE #createMeta()
static #handleError(res, error) { }

// BON:
static #createMeta(context, extras = {}) { ... }
```

❌ **ERREUR 3:** Réponses incohérentes
```javascript
// MAUVAIS:
res.json({ success: true, data })

// BON:
res.successResponse(data, 'Message', { statusCode: 200 })
```

❌ **ERREUR 4:** Logging avec console
```javascript
// MAUVAIS:
console.log("Debug info")

// BON:
Logger.info('FEATURE', 'Action', { data })
```

## Recommandations

- Si **< 2 helpers manquants:** Ajouter les helpers
- Si **< 4 méthodes non-statiques:** Ajouter `static` keyword
- Si **> 4 problèmes:** Refactorisation complète recommandée
- Si **export const functions:** Conversion en classe version 2.0
- Si **controller dans `/controllers/`:** Déplacer à la racine du feature

## 🔄 Migration - Déplacer un Controller

### AVANT (Ancienne structure):
```
/server/features/backups/
├── controllers/
│   └── BackupController.js
│   └── index.js
├── routes/
│   └── backupRoutes.js
├── services/
├── index.js
```

**Imports nécessitaient:**
```javascript
import { BackupController } from './controllers/BackupController.js';
```

### APRÈS (Nouvelle structure):
```
/server/features/backups/
├── BackupController.js        ✅ Déplacé à racine
├── routes/
│   └── backupRoutes.js
├── services/
├── index.js
```

**Les imports changent maintenant à:**
```javascript
import { BackupController } from './BackupController.js';
```

### Checklist de Migration:
1. ✅ Déplacer `FeatureController.js` de `./controllers/` vers `./ (racine du feature)`
2. ✅ Mettre à jour `routes/featureRoutes.js`:
   - Changer: `from '../controllers/FeatureController.js'`
   - En: `from '../FeatureController.js'`
3. ✅ Mettre à jour `index.js` du feature:
   - Changer: `from './controllers/FeatureController.js'`
   - En: `from './FeatureController.js'`
4. ✅ Chercher tous les imports du controller dans le projet:
   - Terminal: `grep -r "controllers/FeatureController" .`
   - Mettre à jour tous les chemins trouvés
5. ✅ Vérifier les tests (s'il existe):
   - Mettre à jour les imports de test aussi
6. ✅ Supprimer le dossier `/controllers/` si complètement vide:
   - `rmdir ./features/feature/controllers/`
7. ✅ Vérifier que le serveur démarre sans erreurs:
   - `npm run server:lrgmedia`
   - Vérifier dans `app.log` qu'il n'y a pas d'erreurs d'import

**IMPORTANT:** S'il reste d'autres fichiers dans `/controllers/` (index.js), les déplacer ou les supprimer aussi

## 🔍 Exemple Concret de Migration - Feature "Backups"

### État AVANT:
```
/server/features/backups/
├── controllers/
│   ├── BackupController.js           ❌ MAUVAIS ENDROIT
│   └── index.js                      ❌ INUTILE
├── routes/
│   └── backupRoutes.js
├── services/
│   └── BackupService.js
└── index.js
```

**Imports AVANT (à corriger):**

**File: `backupRoutes.js`**
```javascript
// ❌ ANCIEN:
import { BackupController } from '../controllers/BackupController.js';
```

**File: `index.js`**
```javascript
// ❌ ANCIEN:
export { BackupController } from './controllers/BackupController.js';
```

---

### État APRÈS:
```
/server/features/backups/
├── BackupController.js              ✅ À LA RACINE
├── routes/
│   └── backupRoutes.js
├── services/
│   └── BackupService.js
└── index.js
```

**Imports APRÈS (corrigés):**

**File: `backupRoutes.js`**
```javascript
// ✅ NOUVEAU:
import { BackupController } from '../BackupController.js';
```

**File: `index.js`**
```javascript
// ✅ NOUVEAU:
export { BackupController } from './BackupController.js';
```

### Terminal Commands:
```powershell
# 1. Déplacer le fichier
mv "server/features/backups/controllers/BackupController.js" "server/features/backups/BackupController.js"

# 2. Vérifier qu'il n'y a pas d'autres imports cassés
grep -r "controllers/BackupController" .

# 3. Supprimer le dossier vide
rmdir "server/features/backups/controllers"

# 4. Vérifier que ça marche
npm run server:lrgmedia
```

---

## 🧪 Testing - Créer un Script PowerShell

### ⚠️ OBLIGATION: Après chaque modification de controller, créer un script de test!

Créer un fichier `test.{feature}.routes.ps1` qui teste **TOUTES** les routes utilisant ce controller.

Le script DOIT tester:
- ✅ Toutes les routes GET (list, get one, get special)
- ✅ Toutes les routes POST (create, create related)
- ✅ Toutes les routes PUT (update, update status)
- ✅ Toutes les routes DELETE
- ✅ Toutes les routes d'action (:id/action)
- ✅ Métadonnées dans chaque réponse (portal, user_id, action)
- ✅ Codes HTTP corrects (200, 201, 400, 401, 404, 500)

### Emplacement du script:
```
/server/features/feature/
├── FeatureController.js
├── routes/
│   └── featureRoutes.js
├── test.feature.routes.ps1           ✅ À la racine du feature
├── index.js
└── services/
```

### Template PowerShell pour Tester un Controller:

```powershell
# Fichier: /server/features/{feature}/test.{feature}.routes.ps1
# IMPORTANT: Ce script DOIT tester TOUTES les routes du controller!
# 
# Pour trouver toutes les routes:
#   1. Ouvre /server/features/{feature}/routes/{feature}Routes.js
#   2. Repère chaque: router.get(), router.post(), router.put(), router.delete()
#   3. Adapte le script pour tester CHAQUE route
#
# Les routes non-testées = BUGS potentiels non détectés!

param (
    [string]$BaseUrl = "http://localhost:3001",
    [string]$Email = "info@lrgmedia.ca",
    [string]$Password = "Secret1234!"
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🧪 {FEATURE} CONTROLLER - COMPLETE TEST SUITE" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

# Configuration
$headers = @{
    "Content-Type" = "application/json"
    "x-portal-type" = "lrgmedia"
}

# ══════════════════════════════════════════════════════════════
# STEP 1: Get Authentication Token
# ══════════════════════════════════════════════════════════════

Write-Host "📍 STEP 1: Authentication" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────"

try {
    $loginData = @{
        email    = $Email
        password = $Password
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/auth/login" `
        -Method POST `
        -Headers $headers `
        -Body $loginData `
        -ErrorAction Stop

    $authToken = $loginResponse.data.accessToken
    $userId = $loginResponse.data.user.id
    
    Write-Host "✅ LOGIN SUCCESSFUL" -ForegroundColor Green
    Write-Host "   User ID: $userId"
} catch {
    Write-Host "❌ LOGIN FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)"
    exit 1
}

$authHeaders = @{
    "Authorization" = "Bearer $authToken"
    "x-portal-type" = "lrgmedia"
    "Content-Type"  = "application/json"
}

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TESTING ALL ROUTES" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# ══════════════════════════════════════════════════════════════
# ROUTES - À ADAPTER POUR CHAQUE FEATURE
# ══════════════════════════════════════════════════════════════

# TEST 1: GET /api/{endpoint} - List all
Write-Host "[1] GET /api/{endpoint}" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$BaseUrl/api/{endpoint}" `
        -Headers $authHeaders -TimeoutSec 5
    Write-Host "✅ LIST" -ForegroundColor Green -NoNewline
    Write-Host " | Count: $($result.data.length) | Meta: portal=$($result.meta.portal)"
} catch {
    Write-Host "❌ LIST FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# TEST 2: POST /api/{endpoint} - Create new resource
Write-Host "[2] POST /api/{endpoint}" -ForegroundColor Yellow
try {
    $createData = @{
        # ADAPTER LES CHAMPS REQUIS SELON LE CONTROLLER
        # Exemple pour appointments: title, description, appointment_date, time_slot
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "$BaseUrl/api/{endpoint}" `
        -Method POST -Headers $authHeaders -Body $createData -TimeoutSec 10
    Write-Host "✅ CREATE" -ForegroundColor Green -NoNewline
    Write-Host " | ID: $($result.data.id) | Status: $($result.data.status)"
    $resourceId = $result.data.id
} catch {
    Write-Host "❌ CREATE FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $resourceId = 1  # Fallback ID for remaining tests
}

# TEST 3: GET /api/{endpoint}/:id - Get single resource
Write-Host "[3] GET /api/{endpoint}/$resourceId" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$BaseUrl/api/{endpoint}/$resourceId" `
        -Headers $authHeaders -TimeoutSec 5
    Write-Host "✅ GET ONE" -ForegroundColor Green -NoNewline
    Write-Host " | Title: $($result.data.title)"
} catch {
    Write-Host "❌ GET ONE FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# TEST 4: PUT /api/{endpoint}/:id - Update resource
Write-Host "[4] PUT /api/{endpoint}/$resourceId" -ForegroundColor Yellow
try {
    $updateData = @{
        # ADAPTER LES CHAMPS À METTRE À JOUR
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "$BaseUrl/api/{endpoint}/$resourceId" `
        -Method PUT -Headers $authHeaders -Body $updateData -TimeoutSec 5
    Write-Host "✅ UPDATE" -ForegroundColor Green -NoNewline
    Write-Host " | Updated fields changed"
} catch {
    Write-Host "❌ UPDATE FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# TEST 5: DELETE /api/{endpoint}/:id - Delete resource
Write-Host "[5] DELETE /api/{endpoint}/$resourceId" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$BaseUrl/api/{endpoint}/$resourceId" `
        -Method DELETE -Headers $authHeaders -TimeoutSec 5
    Write-Host "✅ DELETE" -ForegroundColor Green -NoNewline
    Write-Host " | Deleted ID: $($result.data.id)"
} catch {
    Write-Host "❌ DELETE FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# ══════════════════════════════════════════════════════════════
# ROUTES SPÉCIALES - À AJOUTER SELON LE CONTROLLER
# ══════════════════════════════════════════════════════════════

# Exemples de routes spéciales qui DOIVENT ÊTRE TESTÉES:
# - GET /api/{endpoint}/special-list - Routes avec GET spéciales
# - GET /api/{endpoint}/available-dates - Routes de filtrages/stats
# - POST /api/{endpoint}/:id/action - Routes d'actions avec :id
# - PUT /api/{endpoint}/:id/status - Routes de changement de statut
# - GET /api/{endpoint}/:id/related - Routes de ressources liées

# ADAPTER CES TESTS POUR CHAQUE CONTROLLER!

Write-Host "`n╔═USE THIS AS TEMPLATE FOR SPECIAL ROUTES╗" -ForegroundColor DarkGray

# TEST 6 (SPÉCIAL): GET /api/{endpoint}/special-endpoint
Write-Host "[6] GET /api/{endpoint}/special-endpoint" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$BaseUrl/api/{endpoint}/special-endpoint" `
        -Headers $authHeaders -TimeoutSec 5
    Write-Host "✅ SPECIAL GET" -ForegroundColor Green
} catch {
    Write-Host "⚠️  SPECIAL GET (peut ne pas exister)" -ForegroundColor Gray
}

# TEST 7 (SPÉCIAL): POST /api/{endpoint}/:id/action
Write-Host "[7] POST /api/{endpoint}/$resourceId/action" -ForegroundColor Yellow
try {
    $actionData = @{
        # ADAPTER LES DONNÉES D'ACTION
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "$BaseUrl/api/{endpoint}/$resourceId/action" `
        -Method POST -Headers $authHeaders -Body $actionData -TimeoutSec 5
    Write-Host "✅ ACTION" -ForegroundColor Green
} catch {
    Write-Host "⚠️  ACTION (peut ne pas exister)" -ForegroundColor Gray
}

# TEST 8 (SPÉCIAL): PUT /api/{endpoint}/:id/status
Write-Host "[8] PUT /api/{endpoint}/$resourceId/status" -ForegroundColor Yellow
try {
    $statusData = @{
        status = "ACTIVE"  # ADAPTER SELON LE CONTROLLER
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "$BaseUrl/api/{endpoint}/$resourceId/status" `
        -Method PUT -Headers $authHeaders -Body $statusData -TimeoutSec 5
    Write-Host "✅ STATUS UPDATE" -ForegroundColor Green
} catch {
    Write-Host "⚠️  STATUS UPDATE (peut ne pas exister)" -ForegroundColor Gray
}

# ══════════════════════════════════════════════════════════════
# VALIDATION
# ══════════════════════════════════════════════════════════════

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ TEST SUITE COMPLETED" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n📋 CHECKLIST - VÉRIFIER DANS LES LOGS:" -ForegroundColor Cyan
Write-Host "  [ ] Tous les appels sont loggés (Logger.info)"
Write-Host "  [ ] Les erreurs sont loggées (Logger.error)"
Write-Host "  [ ] Métadonnées présentes: portal, user_id, action"
Write-Host "  [ ] Format de réponse: { data, meta, success }"
Write-Host "  [ ] Codes HTTP corrects: 200, 201, 400, 404"
Write-Host "  [ ] Pas de console.log (UNIQUEMENT Logger)"

Write-Host "`n💡 Vérifier app.log:" -ForegroundColor Cyan
Write-Host "  Get-Content server/logs/app.log -Tail 50`n" -ForegroundColor Gray
```

### Comment Utiliser ce Script:

```powershell
# 1. Lancer le serveur d'abord
npm run dev:lrgmedia

# Dans un NEW terminal:

# 2. Exécuter le script de test (adapte le chemin selon le feature)
cd C:\Projects\ClientPortalLRG

# Pour Backups:
powershell ./server/features/backups/test.backups.routes.ps1

# Pour Appointments:
powershell ./server/features/appointments/test.appointments.routes.ps1

# Pour Tasks:
powershell ./server/features/tasks/test.tasks.routes.ps1

# 3. Vérifier les résultats (✅ ou ❌)
# 4. Vérifier app.log pour détails:
Get-Content "server/logs/app.log" -Tail 50
```

### 🔍 Comment Identifier TOUTES les Routes à Tester:

**ÉTAPE 1: Ouvre le fichier des routes**
```
/server/features/{feature}/routes/{feature}Routes.js
```

**ÉTAPE 2: Cherche CHAQUE ligne avec:**
```javascript
router.get(       // ← Route GET
router.post(      // ← Route POST
router.put(       // ← Route PUT
router.delete(    // ← Route DELETE
router.patch(     // ← Route PATCH
```

**ÉTAPE 3: Note TOUTES les routes trouvées**
```javascript
// Exemple du fichier appointmentsRoutes.js:
router.get('/', ...)                        // GET list
router.get('/available-slots', ...)         // GET special 1
router.get('/occupied-dates', ...)          // GET special 2
router.get('/contacts/search', ...)         // GET special 3
router.get('/contacts', ...)                // GET special 4
router.get('/accounts', ...)                // GET special 5
router.post('/contacts', ...)               // POST special
router.get('/:id', ...)                     // GET one (⚠️ TOUJOURS APRÈS les routes spéciales!)
router.post('/:id/reminder', ...)           // POST action
router.put('/:id/status', ...)              // PUT action
router.delete('/:id', ...)                  // DELETE
```

**ÉTAPE 4: Compte le nombre TOTAL de routes**
```
Appointments: 14 routes à tester!
Auth: ~7-10 routes à tester!
Tasks: ~8-12 routes à tester!
```

**ÉTAPE 5: Adapte le script PowerShell pour TOUTES les routes**
```powershell
# Le script doit avoir au MINIMUM une section TEST [N] pour CHAQUE route!
# Si tu as 14 routes, le script doit avoir 14+ sections TEST!

# ❌ WRONG: Script avec seulement 5 tests CRUD
# ✅ CORRECT: Script avec 14+ tests couvrant TOUTES les routes
```

### ⚠️ RÈGLE IMPORTANTE:

**Routes non-testées = BUGS CACHÉS!**

Chaque route doit être validée avec:
- ✅ Statut HTTP correct
- ✅ Format de réponse correct
- ✅ Métadonnées (portal, user_id, action)
- ✅ Logger présent dans les logs
- ✅ Gestion d'erreur correcte

### Checklist - Script de Test DOIT Vérifier:

- [ ] **Authentification:** Connexion et récupération du token
- [ ] **Chaque route:** GET, POST, PUT, DELETE liées au controller
- [ ] **Codes HTTP:** 200, 201, 400, 401, 404, 500
- [ ] **Format réponse:** `{ meta, data, success/error }`
- [ ] **Métadonnées:** `portal`, `user_id`, `action` présentes
- [ ] **Erreurs:** Les messages d'erreur sont cohérents

### Adapter le Script pour Chaque Feature:

**Pour AuthController (test.auth.routes.ps1) - TOUTES les routes:**
```powershell
# 1. POST /auth/login
# 2. POST /auth/verify
# 3. POST /auth/logout
# 4. POST /auth/refresh
# 5. POST /auth/otp
# 6. POST /auth/password-reset
# etc... (Vérifier toutes les routes dans authRoutes.js)
```

**Pour TasksController (test.tasks.routes.ps1) - TOUTES les routes:**
```powershell
# CRUD de base:
# 1. GET /api/tasks (list all)
# 2. POST /api/tasks (create)
# 3. GET /api/tasks/:taskId (get one)
# 4. PUT /api/tasks/:taskId (update)
# 5. DELETE /api/tasks/:taskId (delete)

# Routes spéciales (À TESTER AUSSI):
# 6. GET /api/tasks/status/pending (filtered list)
# 7. GET /api/tasks/:id/subtasks (related resources)
# 8. PUT /api/tasks/:id/status (status change)
# 9. POST /api/tasks/:id/assign (action)
# etc... (Vérifier TOUTES les routes dans tasksRoutes.js)
```

**Pour AppointmentsController (test.appointments.routes.ps1) - EXEMPLE COMPLET:**
```powershell
# 📋 ROUTES PRINCIPALES (CRUD):
# 1. GET /api/appointments (list all - avec pagination)
# 2. POST /api/appointments (create new)
# 3. GET /api/appointments/:id (get one)
# 4. PUT /api/appointments/:id (update)
# 5. DELETE /api/appointments/:id (delete)

# 📅 ROUTES SPÉCIALES - Disponibilité/Dates:
# 6. GET /api/appointments/available-slots (créneaux dispo)
# 7. GET /api/appointments/occupied-dates (dates occupées)

# 👥 ROUTES CONTACTS:
# 8. GET /api/appointments/contacts (list contacts)
# 9. POST /api/appointments/contacts (create contact)
# 10. GET /api/appointments/contacts/search (search contacts)

# 🏢 ROUTES COMPTES:
# 11. GET /api/appointments/accounts (list accounts)
# 12. GET /api/appointments/accounts/:id/contacts (contacts by account)

# ⚡ ROUTES D'ACTIONS:
# 13. POST /api/appointments/:id/reminder (send reminder)
# 14. PUT /api/appointments/:id/status (change status)

# ⚠️ IMPORTANT: Ne pas oublier les routes spéciales AVANT /:id!
# (Sinon /:id capture les routes spéciales comme des ressources)
```

### ⚠️ CONVENTION DE NOMMAGE:

Tous les fichiers de test doivent suivre le format: **`test.{feature}.routes.ps1`**

Exemples:
- ✅ `test.backups.routes.ps1` (pas `test-backups-routes.ps1`)
- ✅ `test.appointments.routes.ps1` (pas `test-appointments-routes.ps1`)
- ✅ `test.auth.routes.ps1` (pas `test-auth-routes.ps1`)
- ✅ `test.tasks.routes.ps1` (pas `test-tasks-routes.ps1`)

### ⚠️ RÈGLES IMPORTANTES:

1. **AVANT** de commenter les changements, **TOUS les tests DOIVENT passer** ✅
2. **Tests INCOMPLETS** = Bugs cachés non détectés!
3. Script DOIT tester **CHAQUE route** du controller (pas just CRUD)
4. **APRÈS** migration ou refactorisation, relancer le script
5. **Vérifier app.log** après chaque test pour logging errors
6. **Garder le script** dans le dossier du feature pour faciliter les tests futurs
7. **MISE À JOUR DU SCRIPT** OBLIGATOIRE chaque fois qu'une route est ajoutée/modifiée

### ❌ TEST INCOMPLET = REJETÉ

Critères de rejet:
- [ ] Routes spéciales non testées (`:id`)
- [ ] Routes d'action non testées (`/:id/action`)
- [ ] Routes de filtrages non testées (`/filter`, `/search`)
- [ ] Routes de statut non testées (`/:id/status`)
- [ ] Moins de routes testées que dans la réalité
- [ ] Format test inadapté au controller

### ✅ TEST COMPLET = ACCEPTÉ

Critères de validation:
- [ ] **TOUTES les routes** du controller sont testées
- [ ] Format powershell `test.{feature}.routes.ps1`
- [ ] Métadonnées vérifiées dans les réponses
- [ ] Codes HTTP vérifiés (200, 201, 400, 404)
- [ ] Logger.info/error présent dans les logs
- [ ] Pas de console.log détecté
- [ ] Documentation des routes dans le script


