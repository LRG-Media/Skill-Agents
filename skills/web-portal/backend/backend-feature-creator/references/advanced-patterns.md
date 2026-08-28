# Patterns Avancés

Patterns complémentaires pour les features complexes.

## Custom Fields (ModuleFieldsService)

### Lecture Batch (Liste)

```js
import { ModuleFieldsService } from '../../system/settings/services/ModuleFieldsService.js';

// Retourne Map<id, fields>
const customMap = await ModuleFieldsService.getCustomFields('credit_note', ids);
for (const item of items) {
  item.custom_fields = customMap.get(item.id) || {};
}
```

### Lecture Single (Détail)

```js
item.custom_fields = await ModuleFieldsService.getCustomFields('credit_note', item.id) || {};
```

### Écriture

```js
await ModuleFieldsService.updateCustomFields({
  entityType: 'credit_note',
  entityId: id,
  values: { field_key: 'value' },
  userId: context.userId,
  moduleName: 'credit_notes',
  validate: true,
});
```

### Suppression

```js
await ModuleFieldsService.deleteCustomFields('credit_note', id);
```

## Cache (cacheService)

```js
import { cacheService } from '../../../shared/services/index.js';

// Set (TTL en ms)
cacheService.set('credit_notes:list:123', data, 300000);  // 5min

// Get
const cached = cacheService.get('credit_notes:list:123');

// Invalidate (wildcard)
cacheService.invalidate('credit_notes:*');

// Check
if (cacheService.has('key')) { /* ... */ }

// Delete
cacheService.delete('key');
```

## Activity Log

```js
import { activityLog } from '../../../shared/logging/index.js';

// Événement générique
activityLog.event('credit_note.created', 'credit_note', id, { userId, metadata });

// Méthodes courtes
activityLog.contact.created(contactId, { userId });
activityLog.updateStatus(logId, 'success', { metadata });
```

## Aggregation Response

```js
import { aggregationResponse } from '../../../shared/middleware/index.js';

// Response avec agrégations
res.aggregationResponse(data, aggregations, 'Message', options);

// Liste avec agrégations
res.listWithAggregations(items, pagination, aggregations, options);

// Détail avec agrégations
res.detailWithAggregations(item, aggregations, options);

// Vérifier si le client demande les agrégations
if (req.query.include_aggregations) { /* ... */ }
```

## Performance Tracking

```js
const trackPerformance = (operationName, startTime, context = {}) => {
  const duration = Date.now() - startTime;
  if (duration > 100) {
    Logger.perf('MODULE', `${operationName} took ${duration}ms`, { duration_ms: duration, ...context });
  }
};

// Utilisation
const startTime = Date.now();
// ... opération ...
trackPerformance('getItems', startTime, { count: items.length });
```

## BaseAggregationService

```js
import { BaseAggregationService } from '../../../shared/services/index.js';

class CreditNoteService extends BaseAggregationService {
  async getData(filters, options, user) {
    // Retourne { items, total }
  }

  async getAggregations(filters, user, options) {
    // Retourne { total_amount: { sum: ... }, by_status: { ... } }
  }
}

// Utilisation
const service = new CreditNoteService();
const { data, aggregations } = await service.getWithAggregations(filters, options, user);
```

## Transaction Prisma

```js
// Transaction array
const [item, log] = await prisma.$transaction([
  prisma.credit_notes.create({ data: { ... } }),
  prisma.activity_logs.create({ data: { ... } }),
]);

// Interactive transaction
const result = await prisma.$transaction(async (tx) => {
  const item = await tx.credit_notes.update({ where: { id }, data: { status: 'applied' } });
  await tx.activity_logs.create({ data: { ... } });
  return item;
});
```

## Validation Custom (Service-Level)

```js
// Quand la validation est trop complexe pour JSON Schema
static async createCreditNote(data, userId = null) {
  const errors = [];

  if (!data.account_id) errors.push('account_id requis');
  if (data.amount && data.amount <= 0) errors.push('amount doit être positif');
  if (data.invoice_id) {
    const invoice = await prisma.invoices.findUnique({ where: { id: data.invoice_id } });
    if (!invoice) errors.push('Facture non trouvée');
  }

  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }

  // ... création
}
```
