# Étape 7 : Controller (5 Helpers Obligatoires)

Classe Controller avec les 5 helpers privés et les méthodes CRUD.

## Template

```js
// server/features/[domain]/[feature]/[Feature]Controller.js

import Logger from '../../../shared/logging/Logger.js';
import { CreditNoteService } from './credit-note.service.js';

export class CreditNoteController {

  // ═══ 5 HELPERS PRIVÉS OBLIGATOIRES ═══

  // 1️⃣ Extraire le contexte utilisateur
  static #getContext = (req) => ({
    portal: req.portal || 'lrgmedia',
    userId: req.user?.id,
    user: req.user,
    userRole: req.user?.role
  });

  // 2️⃣ Valider et parser l'ID
  static #validateId = (id) => {
    if (!id) throw new Error('ID invalide');
    const numId = parseInt(id, 10);
    if (isNaN(numId)) throw new Error('ID doit être un nombre valide');
    return numId;
  };

  // 3️⃣ Créer les métadonnées standard
  static #createMeta = (context, extras = {}) => ({
    portal: context.portal,
    user_id: context.userId,
    user_role: context.userRole,
    ...extras
  });

  // 4️⃣ Gestion d'erreur DRY
  static #handleError = (res, errorCode, message, statusCode, error, context) => {
    Logger.error('CREDIT_NOTES', message, { ...context, error: error?.message }, error);
    return res.errorResponse([{ code: errorCode, message }], message, statusCode || 500);
  };

  // 5️⃣ Wrapper d'opération DRY
  static #executeOperation = async (req, res, operationName, serviceMethod, successMessage, options = {}) => {
    try {
      const context = CreditNoteController.#getContext(req);
      Logger.info('CREDIT_NOTES', operationName, {
        user_id: context.userId,
        portal: context.portal,
        ...options.logData
      });
      const result = await serviceMethod(context);
      return res.successResponse(result, successMessage, {
        statusCode: options.statusCode || 200,
        meta: CreditNoteController.#createMeta(context, { action: operationName.toLowerCase() })
      });
    } catch (error) {
      return CreditNoteController.#handleError(
        res,
        options.errorCode || 'OPERATION_ERROR',
        error.message,
        options.errorStatus || 500,
        error,
        { user_id: req.user?.id }
      );
    }
  };

  // ═══ MÉTHODES PUBLIQUES ═══

  static getAll = async (req, res) => {
    try {
      const context = CreditNoteController.#getContext(req);
      const { page = 1, limit = 100, ...filters } = req.query;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      const { items, total } = await CreditNoteService.getCreditNotes({ ...filters, limit: parseInt(limit, 10), offset });
      const totalPages = Math.ceil(total / parseInt(limit, 10));

      return res.listResponse(
        items.map(i => i.toSummary()),
        {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: totalPages,
          has_more: offset + items.length < total,
        },
        {
          meta: CreditNoteController.#createMeta(context, { action: 'credit_notes_listed' })
        }
      );
    } catch (error) {
      return CreditNoteController.#handleError(res, 'CREDIT_NOTES_FETCH_ERROR', 'Erreur lors de la récupération', 500, error, { user_id: req.user?.id });
    }
  };

  static getById = async (req, res) => {
    try {
      const id = CreditNoteController.#validateId(req.params.id);
      const item = await CreditNoteService.getCreditNoteById(id);
      if (!item) {
        return res.errorResponse([{ code: 'NOT_FOUND', message: 'Note de crédit non trouvée' }], 'Non trouvée', 404);
      }
      return res.successResponse(item.toDetailedObject(), 'Note de crédit récupérée');
    } catch (error) {
      return CreditNoteController.#handleError(res, 'CREDIT_NOTES_FETCH_ERROR', error.message, 500, error, { user_id: req.user?.id });
    }
  };

  static create = async (req, res) => {
    try {
      const context = CreditNoteController.#getContext(req);
      const item = await CreditNoteService.createCreditNote(req.body, context.userId);
      return res.successResponse(item.toDetailedObject(), 'Note de crédit créée', {
        statusCode: 201,
        meta: CreditNoteController.#createMeta(context, { action: 'credit_note_created' })
      });
    } catch (error) {
      return CreditNoteController.#handleError(res, 'CREDIT_NOTES_CREATE_ERROR', error.message, 500, error, { user_id: req.user?.id });
    }
  };

  static update = async (req, res) => {
    try {
      const id = CreditNoteController.#validateId(req.params.id);
      const context = CreditNoteController.#getContext(req);
      const item = await CreditNoteService.updateCreditNote(id, req.body, context.userId);
      return res.successResponse(item.toDetailedObject(), 'Note de crédit mise à jour', {
        meta: CreditNoteController.#createMeta(context, { action: 'credit_note_updated' })
      });
    } catch (error) {
      return CreditNoteController.#handleError(res, 'CREDIT_NOTES_UPDATE_ERROR', error.message, 500, error, { user_id: req.user?.id });
    }
  };

  static delete = async (req, res) => {
    try {
      const id = CreditNoteController.#validateId(req.params.id);
      const context = CreditNoteController.#getContext(req);
      await CreditNoteService.deleteCreditNote(id, context.userId);
      return res.successResponse(null, 'Note de crédit supprimée', {
        meta: CreditNoteController.#createMeta(context, { action: 'credit_note_deleted' })
      });
    } catch (error) {
      return CreditNoteController.#handleError(res, 'CREDIT_NOTES_DELETE_ERROR', error.message, 500, error, { user_id: req.user?.id });
    }
  };
}
```

## Les 5 Helpers Privés

| # | Helper | Rôle |
|---|--------|------|
| 1 | `#getContext(req)` | Extrait `portal`, `userId`, `user`, `userRole` de la requête |
| 2 | `#validateId(id)` | Parse et valide l'ID (parseInt + isNaN check) |
| 3 | `#createMeta(context, extras)` | Crée les métadonnées standard pour les réponses |
| 4 | `#handleError(res, code, msg, status, error, ctx)` | Logger.error + res.errorResponse (DRY) |
| 5 | `#executeOperation(req, res, name, method, msg, opts)` | Wrapper try/catch complet avec logging |

## Méthodes Publiques

| Méthode | HTTP | Service | Response |
|---------|------|---------|----------|
| `getAll` | GET / | `getCreditNotes(filters)` | `res.listResponse(items, pagination)` |
| `getById` | GET /:id | `getCreditNoteById(id)` | `res.successResponse(data)` |
| `create` | POST / | `createCreditNote(body, userId)` | `res.successResponse(data, msg, {statusCode: 201})` |
| `update` | PUT /:id | `updateCreditNote(id, body, userId)` | `res.successResponse(data)` |
| `delete` | DELETE /:id | `deleteCreditNote(id, userId)` | `res.successResponse(null, msg)` |

## Méthodes de Response Disponibles

```js
// Détail
res.successResponse(data, message, { statusCode, meta, cache, cacheTTL });

// Liste paginée
res.listResponse(items, { total, page, limit, pages, has_more }, { meta, aggregations });

// Erreur
res.errorResponse([{ code: 'ERROR_CODE', message: '...' }], message, statusCode);
```

## Règles Controller

- Classe `export class` avec méthodes `static` (arrow functions `= async (req, res) => {}`)
- **5 helpers privés obligatoires** (préfixe `#`)
- `Logger` pour tous les logs (JAMAIS `console.*`)
- Réponses via `res.successResponse()`, `res.listResponse()`, `res.errorResponse()`
- snake_case dans les réponses API (`created_at`, `user_id`)
- `req.user?.id` pour l'utilisateur (jamais `req.body.userId`)
- Log contextuel : `{ user_id, portal, action }` dans chaque réponse
