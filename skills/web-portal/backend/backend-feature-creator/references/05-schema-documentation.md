# Étape 5 : Schema Documentation (Prisma Schema Class)

Classe de documentation du schéma Prisma pour décrire la structure de la table.

## Template

```js
// server/features/[domain]/[feature]/models/[Feature]Schema.js

export class CreditNotesSchema {
  static FEATURE = 'finance';
  static SCHEMA = 'finance';

  static FEATURE_TO_SCHEMA_MAPPING = {
    'credit_notes': null,
  };

  static BASE_SCHEMA = {
    credit_notes: {
      id: { type: 'Int', primary: true, autoIncrement: true },
      account_id: { type: 'Int', nullable: false },
      contact_id: { type: 'Int', nullable: true },
      invoice_id: { type: 'Int', nullable: true },
      amount: { type: 'Decimal', precision: 10, scale: 2 },
      reason: { type: 'String', nullable: true, maxLength: 500 },
      status: { type: 'CreditNoteStatus', default: 'draft' },
      issued_date: { type: 'DateTime', nullable: true },
      applied_date: { type: 'DateTime', nullable: true },
      created_at: { type: 'DateTime', default: 'now()' },
      updated_at: { type: 'DateTime', default: 'updatedAt' },
      deleted_at: { type: 'DateTime', nullable: true },
      relations: {
        account: { type: 'accounts', fields: ['account_id'], references: ['id'] },
        contact: { type: 'contacts', fields: ['contact_id'], references: ['id'] },
        invoice: { type: 'invoices', fields: ['invoice_id'], references: ['id'] },
      },
      indexes: [['account_id'], ['status'], ['created_at']]
    }
  };

  static ENUMS = {
    CreditNoteStatus: ['draft', 'issued', 'applied', 'cancelled']
  };
}
```

## Règles

- Nom : `PascalCase + Schema.js` (ex: `LeadsSchema.js`, `CreditNotesSchema.js`)
- Props statiques : `FEATURE`, `SCHEMA`, `BASE_SCHEMA`, `ENUMS`
- `FEATURE_TO_SCHEMA_MAPPING` : map feature name → schema name
- `BASE_SCHEMA` : décrit chaque colonne avec `type`, `nullable`, `default`, `maxLength`
- `relations` : décrit les FK avec `type`, `fields`, `references`
- `indexes` : liste des index (tableaux de colonnes)
- `ENUMS` : valeurs possibles pour les types enum
- Placer dans `models/` (jamais de index.js dans models/)
