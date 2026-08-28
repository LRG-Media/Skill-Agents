---
name: zoho-books
description: Interagir avec l'API Zoho Books (comptabilité, journaux, comptes, modules custom). Gérer l'auth OAuth, lire/créer des écritures, vérifier les soldes, automatiser la paie.
applyTo: "**/*zoho*|**/*books*|**/*payroll*"
---

# Zoho Books API

## 1. Ressources

- **Documentation API** : `API documentation/` (37 fichiers YAML)
- **Scripts existants** : `scripts/`
- **Organisation** : LRG Media (ID: `851244506`), CAD, Québec

## 2. Authentification OAuth

### Flow

1. **Self Client** sur `api-console.zoho.com`
2. Générer un **Grant Token** (durée de vie courte)
3. Échanger contre **Access Token** + **Refresh Token**

### Endpoints Token

| Domaine | URL |
|---------|-----|
| CA | `https://accounts.zoho.ca/oauth/v2/token` |
| COM | `https://accounts.zoho.com/oauth/v2/token` |

> **Note** : L'organisation est sur `zohoapis.com` mais l'auth commence souvent par `zoho.com`.

### Script d'échange

```bash
node scripts/zoho-token-exchange.mjs
```

Met à jour le `GRANT_TOKEN` dans le script, puis exécuter.

### Refresh Token

```bash
curl -X POST https://accounts.zoho.com/oauth/v2/token \
  -d "refresh_token=1000.xxx" \
  -d "client_id=1000.ZUQQWF2O2C34XR2FFIZGUR6M7SMGID" \
  -d "client_secret=xxx" \
  -d "grant_type=refresh_token"
```

### Scopes requis

```
ZohoBooks.accountants.CREATE, ZohoBooks.accountants.READ, ZohoBooks.accountants.UPDATE, ZohoBooks.accountants.DELETE,
ZohoBooks.settings.CREATE, ZohoBooks.settings.READ, ZohoBooks.settings.UPDATE, ZohoBooks.settings.DELETE,
ZohoBooks.custommodules.ALL
```

## 3. Structure de base

```
Base URL: https://www.zohoapis.com/books/v3
Header:   Authorization: Zoho-oauthtoken <ACCESS_TOKEN>
Query:    ?organization_id=851244506
```

## 4. Endpoints principaux

### Journaux (Journals)

| Opération | Méthode | Endpoint |
|-----------|---------|----------|
| Lister | GET | `/journals?organization_id={orgId}&date_start=YYYY-MM-DD&date_end=YYYY-MM-DD` |
| Détail | GET | `/journals/{journal_id}?organization_id={orgId}` |
| Créer | POST | `/journals?organization_id={orgId}` |
| Supprimer | DELETE | `/journals/{journal_id}?organization_id={orgId}` |

### Plan comptable (Chart of Accounts)

| Opération | Méthode | Endpoint |
|-----------|---------|----------|
| Lister | GET | `/chartofaccounts?organization_id={orgId}` |
| Détail | GET | `/chartofaccounts/{account_id}?organization_id={orgId}` |
| Créer | POST | `/chartofaccounts?organization_id={orgId}` |

### Modules personnalisés (Custom Modules)

| Opération | Méthode | Endpoint |
|-----------|---------|----------|
| Lister modules | GET | `/settings/custommodules?organization_id={orgId}` |
| Lister enregistrements | GET | `/cm_{module_name}?organization_id={orgId}` |
| Créer enregistrement | POST | `/cm_{module_name}?organization_id={orgId}` |

### Organisation

| Opération | Méthode | Endpoint |
|-----------|---------|----------|
| Infos | GET | `/organizations?organization_id={orgId}` |

## 5. Structure d'une écriture de journal

```json
{
  "journal_date": "2026-08-10",
  "notes": "Description de l'écriture",
  "line_items": [
    {
      "account_id": "5097330000000000445",
      "debit": 1000.00,
      "credit": 0.00,
      "description": "Description ligne"
    },
    {
      "account_id": "5097330000009502012",
      "debit": 0.00,
      "credit": 1000.00,
      "description": "Contrepartie"
    }
  ]
}
```

**Règle** : Total des débits = Total des crédits (sinon erreur 21004).

## 6. Codes d'erreur fréquents

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| 57 | Non autorisé | Token expiré | Refresh ou nouveau grant token |
| 21004 | Débits/Crédits ne correspondent pas | Montants déséquilibrés | Ajuster la ligne de contrepartie |
| 21008 | Montant invalide | Trop de décimales | Arrondir à 2 décimales |
| 11016 | Types de comptes non applicables | Compte bancaire avec journal | Utiliser un compte passif/charge |
| 14805 | Champ Module non valide | `record_name` invalide | Retirer ce champ |

## 7. Bonnes pratiques Deluge

- **Arrondir** : `((val * 100).toLong()) / 100` (pas de `Math.round`)
- **Conditionnel** : `if (((montant * 100).toLong()) > 0)` avant d'ajouter une ligne
- **Pas de** : `Math.min`, `Date.today()`, `replace()`, `split().join()`, `Map` type params
- **Contrepartie** : Utiliser un passif (ex: "Salaires à payer") au lieu d'un compte bancaire

## 8. Scripts disponibles

| Script | Usage |
|--------|-------|
| `zoho-token-exchange.mjs` | Échange grant → access token |
| `zoho-books-explore.mjs` | Explorer l'API (lecture seule) |
| `zoho-create-payroll-accounts.mjs` | Créer comptes et champs custom |
| `zoho-check-balances.mjs` | Vérifier soldes des comptes |
| `zoho-rename-accounts.mjs` | Renommer des comptes |
| `zoho-payroll-deluge.deluge` | Script Deluge paie (à exécuter dans Zoho) |
