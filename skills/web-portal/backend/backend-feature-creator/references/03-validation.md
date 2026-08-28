# Étape 3 : Validation (JSON Schema)

Créer le fichier de validation avec des JSON Schema objects.

## Template

```js
// server/features/[domain]/[feature]/[feature].validation.js

const EMAIL_PATTERN = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
const NAME_PATTERN = "^[a-zA-ZÀ-ÿ\\s\\-']+$";

export const creditNoteValidationSchemas = {
  create: {
    body: {
      type: 'object',
      required: ['account_id', 'amount'],
      properties: {
        account_id:  { type: 'integer', minimum: 1 },
        contact_id:  { type: 'integer', minimum: 1 },
        invoice_id:  { type: 'integer', minimum: 1 },
        amount:      { type: 'number', minimum: 0.01, maximum: 99999999.99 },
        reason:      { type: 'string', maxLength: 500 },
        status:      { type: 'string', enum: ['draft', 'issued', 'applied', 'cancelled'] },
        issued_date: { type: 'string', format: 'date' },
      },
      additionalProperties: false
    }
  },
  update: {
    body: {
      type: 'object',
      properties: {
        amount:      { type: 'number', minimum: 0.01, maximum: 99999999.99 },
        reason:      { type: 'string', maxLength: 500 },
        status:      { type: 'string', enum: ['draft', 'issued', 'applied', 'cancelled'] },
        issued_date: { type: 'string', format: 'date' },
        applied_date:{ type: 'string', format: 'date' },
      },
      minProperties: 1,
      additionalProperties: false
    }
  },
  query: {
    query: {
      type: 'object',
      properties: {
        account_id: { type: 'integer', minimum: 1 },
        status:     { type: 'string', enum: ['draft', 'issued', 'applied', 'cancelled'] },
        page:       { type: 'integer', minimum: 1, default: 1 },
        limit:      { type: 'integer', minimum: 1, maximum: 500, default: 100 },
      },
      additionalProperties: false
    }
  }
};
```

## Règles

- `create` : champs `required` + `additionalProperties: false`
- `update` : tous optionnels + `minProperties: 1` (au moins 1 champ)
- `query` : validation des query params (page, limit, filtres)
- Patterns réutilisables : `EMAIL_PATTERN`, `NAME_PATTERN`
- Enums : lister toutes les valeurs possibles
- `format: 'email'`, `format: 'date'` pour les formats standards

## Utilisation dans les Routes

```js
import { validateRequest } from '../../../shared/middleware/index.js';
import { creditNoteValidationSchemas } from './credit-note.validation.js';

router.post('/', ...mw.manage, validateRequest(creditNoteValidationSchemas.create), Controller.create);
router.put('/:id', ...mw.write, validateRequest(creditNoteValidationSchemas.update), Controller.update);
router.get('/', ...mw.read, validateRequest(creditNoteValidationSchemas.query), paginationMiddleware(), Controller.getAll);
```

## Types de Validation Supportés

| Clé | Cible | Middleware |
|-----|-------|-----------|
| `body` | `req.body` | `validateRequest(schema)` |
| `query` | `req.query` | `validateRequest(schema)` |
| `params` | `req.params` | `validateRequest(schema)` |
