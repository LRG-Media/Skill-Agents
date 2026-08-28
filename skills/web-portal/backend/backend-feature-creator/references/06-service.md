# Étape 6 : Service

Service avec Prisma queries, soft delete, custom fields, et performance tracking.

## Template

```js
// server/features/[domain]/[feature]/[feature].service.js

import { prisma } from '../../../shared/database/prisma.js';
import { CreditNote } from './models/CreditNote.js';
import Logger from '../../../shared/logging/Logger.js';
import { ModuleFieldsService } from '../../system/settings/services/ModuleFieldsService.js';

// ═══ PERFORMANCE TRACKING ═══
const trackPerformance = (operationName, startTime, context = {}) => {
  const duration = Date.now() - startTime;
  if (duration > 100) {
    Logger.perf('CREDIT_NOTES', `${operationName} took ${duration}ms`, { duration_ms: duration, ...context });
  }
};

export class CreditNoteService {

  // ═══ HELPERS PRIVÉS ═══

  static #getDefaultIncludes() {
    return {
      account: { select: { id: true, name: true } },
      contact: { select: { id: true, first_name: true, last_name: true } },
    };
  }

  static #buildWhereClause(filters = {}) {
    const where = { status: { not: 'deleted' } };

    if (filters.account_id) where.account_id = parseInt(filters.account_id, 10);
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { reason: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  static #getValidFields(data) {
    const allowed = ['account_id', 'contact_id', 'invoice_id', 'amount', 'reason', 'status', 'issued_date', 'applied_date'];
    const cleaned = {};
    for (const key of allowed) {
      if (data[key] !== undefined && data[key] !== null) {
        cleaned[key] = data[key];
      }
    }
    return cleaned;
  }

  // ═══ MÉTHODES PUBLIQUES ═══

  static async getCreditNotes(filters = {}) {
    const startTime = Date.now();
    const where = this.#buildWhereClause(filters);
    const limit = filters.limit ? parseInt(filters.limit, 10) : 100;
    const offset = filters.offset ? parseInt(filters.offset, 10) : 0;

    const [items, total] = await Promise.all([
      prisma.credit_notes.findMany({
        where,
        include: this.#getDefaultIncludes(),
        orderBy: [{ created_at: 'desc' }],
        take: limit,
        skip: offset,
      }),
      prisma.credit_notes.count({ where }),
    ]);

    // Custom fields batch
    const ids = items.map(i => i.id).filter(Boolean);
    if (ids.length > 0) {
      const customMap = await ModuleFieldsService.getCustomFields('credit_note', ids);
      for (const item of items) {
        item.custom_fields = customMap.get(item.id) || {};
      }
    }

    trackPerformance('getCreditNotes', startTime, { limit, offset, count: items.length });
    return { items: items.map(i => new CreditNote(i)), total };
  }

  static async getCreditNoteById(id) {
    const startTime = Date.now();
    const item = await prisma.credit_notes.findUnique({
      where: { id: parseInt(id, 10) },
      include: this.#getDefaultIncludes(),
    });

    if (!item || item.status === 'deleted') return null;

    // Custom fields single
    item.custom_fields = await ModuleFieldsService.getCustomFields('credit_note', item.id) || {};

    trackPerformance('getCreditNoteById', startTime, { id });
    return new CreditNote(item);
  }

  static async createCreditNote(data, userId = null) {
    const startTime = Date.now();
    const validFields = this.#getValidFields(data);

    const item = await prisma.credit_notes.create({
      data: {
        ...validFields,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    Logger.info('CREDIT_NOTES', 'Credit note created', { id: item.id, user_id: userId, amount: validFields.amount });
    trackPerformance('createCreditNote', startTime, { id: item.id });
    return new CreditNote(item);
  }

  static async updateCreditNote(id, data, userId = null) {
    const startTime = Date.now();
    const validFields = this.#getValidFields(data);

    const item = await prisma.credit_notes.update({
      where: { id: parseInt(id, 10) },
      data: { ...validFields, updated_at: new Date() },
    });

    Logger.info('CREDIT_NOTES', 'Credit note updated', { id: item.id, user_id: userId });
    trackPerformance('updateCreditNote', startTime, { id: item.id });
    return new CreditNote(item);
  }

  static async deleteCreditNote(id, userId = null) {
    const startTime = Date.now();

    await prisma.credit_notes.update({
      where: { id: parseInt(id, 10) },
      data: { deleted_at: new Date(), status: 'deleted' },
    });

    Logger.info('CREDIT_NOTES', 'Credit note deleted (soft)', { id: parseInt(id, 10), user_id: userId });
    trackPerformance('deleteCreditNote', startTime, { id: parseInt(id, 10) });
    return true;
  }
}
```

## Règles Service

| Règle | Détail |
|-------|--------|
| Import prisma | `import { prisma } from '../../../shared/database/prisma.js'` (named import) |
| Soft delete | `prisma.*.update({ data: { deleted_at, status: 'deleted' } })` — JAMAIS `prisma.*.delete()` |
| Filtre universel | `status: { not: 'deleted' }` dans tous les where |
| Custom fields batch | `ModuleFieldsService.getCustomFields(entityType, ids)` → `Map<id, fields>` |
| Custom fields single | `ModuleFieldsService.getCustomFields(entityType, id)` → `object` |
| Performance | `trackPerformance(name, startTime, context)` — log si >100ms |
| Logger | `Logger.info('MODULE', 'message', { data })` — JAMAIS `console.*` |
| Retour | Wrapper dans classe Model : `new CreditNote(data)` |
| Count | Méthode séparée : `countCreditNotes(filters)` |
| Relations | `#getDefaultIncludes()` pour charger les relations liées |
| Validation | `#getValidFields(data)` pour filtrer les champs autorisés |

## Pattern Count Séparé

```js
static async countCreditNotes(filters = {}) {
  return prisma.credit_notes.count({
    where: { ...this.#buildWhereClause(filters), status: { not: 'deleted' } }
  });
}
```
