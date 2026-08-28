# Étape 10 : README.md

Documentation de la feature obligatoire à la racine du dossier.

## Template

```markdown
# Credit Notes Feature

## Objectif
Gestion des notes de crédit liées aux factures. Permet la création, modification, suppression et suivi des notes de crédit.

## Endpoints

| Méthode | Route | Permission | Description |
|---------|-------|-----------|-------------|
| GET | `/api/credit-notes` | credit_notes.view | Liste des notes de crédit |
| GET | `/api/credit-notes/:id` | credit_notes.view | Détail d'une note de crédit |
| POST | `/api/credit-notes` | credit_notes.manage | Créer une note de crédit |
| PUT | `/api/credit-notes/:id` | credit_notes.edit | Modifier une note de crédit |
| DELETE | `/api/credit-notes/:id` | credit_notes.manage | Supprimer une note de crédit (soft) |

## Schéma

| Champ | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | Int | non | Identifiant unique |
| account_id | Int | non | ID du compte |
| contact_id | Int | oui | ID du contact |
| invoice_id | Int | oui | ID de la facture liée |
| amount | Decimal(10,2) | non | Montant |
| reason | VARCHAR(500) | oui | Motif |
| status | Enum | non | draft/issued/applied/cancelled |
| issued_date | Date | oui | Date d'émission |
| applied_date | Date | oui | Date d'application |
| created_at | DateTime | non | Date de création |
| updated_at | DateTime | non | Dernière mise à jour |
| deleted_at | DateTime | oui | Soft delete |

## Relations

- `account` → accounts (required)
- `contact` → contacts (optional)
- `invoice` → invoices (optional)

## Flux Principal

1. Client → GET /api/credit-notes → CreditNoteController.getAll
2. CreditNoteService.getCreditNotes → Prisma query + custom fields
3. Response: res.listResponse(items, pagination)

## Dépendances

- `server/shared/middleware/` (permissions, validation, rate limiter)
- `server/shared/database/prisma.js` (client Prisma)
- `server/shared/logging/Logger.js` (logging)
- `server/features/system/settings/services/ModuleFieldsService.js` (custom fields)
```

## Contenu Minimal Obligatoire

1. **Objectif fonctionnel** : à quoi sert la feature
2. **Endpoints** : tableau de toutes les routes avec permissions
3. **Schéma** : description des champs de la table
4. **Relations** : les FK et leurs tables cibles
5. **Flux principal** : chemin d'une requête typique (Controller → Service → Prisma → Response)
6. **Dépendances** : services et modules internes utilisés
