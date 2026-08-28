# Étape 1 : Prisma Schema

Créer ou vérifier le modèle Prisma dans `server/prisma/schema/`.

## Template

```prisma
// server/prisma/schema/[schema].prisma
// ou ajouter dans un schéma existant

model credit_notes {
  id            Int       @id @default(autoincrement())
  account_id    Int
  contact_id    Int?
  invoice_id    Int?
  amount        Decimal   @db.Decimal(10, 2)
  reason        String?   @db.VarChar(500)
  status        String    @default("draft")  // draft, issued, applied, cancelled
  issued_date   DateTime? @db.Date()
  applied_date  DateTime? @db.Date()
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
  deleted_at    DateTime?

  // Relations
  account       accounts  @relation(fields: [account_id], references: [id])
  contact       contacts? @relation(fields: [contact_id], references: [id])
  invoice       invoices? @relation(fields: [invoice_id], references: [id])

  @@index([account_id])
  @@index([status])
  @@index([created_at])
  @@schema("finance")
}
```

## Règles

- Toujours inclure `id`, `created_at`, `updated_at`, `deleted_at` (soft delete)
- Index sur les colonnes de filtrage fréquent
- `@@schema()` pour le multi-schema : `public`, `crm`, `finance`, `project`, `customization`
- Relations FK explicites (`@relation(fields: [...], references: [...])`)
- Colonnes string : toujours `@db.VarChar(N)` ou `@db.Text` pour expliciter la taille
- Decimal : `@db.Decimal(precision, scale)` pour les montants

## Migration

```bash
npx prisma migrate dev --name add_credit_notes
npx prisma generate
```

## Schémas Prisma existants

| Schema | Dossier features | Usage |
|--------|-----------------|-------|
| `public` | `system/`, `communication/` | Users, roles, tags, notes, notifications, files |
| `crm` | `crm/` | Contacts, accounts, leads |
| `finance` | `finance/` | Invoices, quotes, payments, subscriptions |
| `project` | `project-management/` | Tasks, appointments, projects, time_entries |
| `customization` | `system/custom-fields/` | Custom fields definitions |
| `custom` | `custom/` | Features portal-spécifiques |
