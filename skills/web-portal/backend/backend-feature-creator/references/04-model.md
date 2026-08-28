# Étape 4 : Model (Business Class)

Classe model qui enveloppe les données Prisma avec des getters computed et des méthodes de formatage.

## Template

```js
// server/features/[domain]/[feature]/models/[Feature].js

export class CreditNote {
  constructor(data) {
    this.data = data;
  }

  // ═══ GETTERS COMPUTÉS ═══

  get id() { return this.data.id; }
  get amount() { return parseFloat(this.data.amount) || 0; }
  get status() { return this.data.status; }
  get isDraft() { return this.data.status === 'draft'; }
  get isApplied() { return this.data.status === 'applied'; }
  get createdAt() { return this.data.created_at; }

  // ═══ FORMATS ═══

  toSummary() {
    return {
      id: this.data.id,
      amount: this.amount,
      status: this.data.status,
      account_id: this.data.account_id,
      issued_date: this.data.issued_date,
      created_at: this.data.created_at,
    };
  }

  toDetailedObject() {
    return {
      ...this.data,
      amount: this.amount,
      // Ajouter les computed props
    };
  }
}
```

## Règles

- Classe `export class` avec `constructor(data)` qui stocke `this.data`
- Getters computed pour les transformations (parseFloat, status checks)
- `toSummary()` : format léger pour les listes
- `toDetailedObject()` : format complet pour le détail
- Ne jamais muter `this.data` directement
- Toujours dans `models/` (dossier obligatoire)

## Exemples dans le Projet

| Model | Fichier | Notes |
|-------|---------|-------|
| `Lead` | `crm/leads/models/Lead.js` | Getters computed + toSummary + toDetailedObject |
| `Contact` | `crm/contacts/models/Contact.js` | fullDisplayName, primaryPhone, isActive |
| `Invoice` | `finance/invoices/models/Invoice.js` | toFormattedInvoice, calculated fields |
| `Task` | `project-management/tasks/models/Task.js` | Priority helpers, status checks |
