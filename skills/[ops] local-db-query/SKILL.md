---
name: ops--local-db-query
description: 'Requeter la base de donnees PostgreSQL locale du portail. A utiliser quand on demande: regarder dans la BDD, query DB, voir les donnees, checker une table, SELECT, verifier en base.'
argument-hint: 'Le portail (ex: lrgmedia) et la requete SQL ou la table a inspecter.'
user-invocable: true
---

# Local DB Query

## Objectif

Se connecter a la base PostgreSQL locale du portail et executer des requetes SQL en lecture seule (SELECT/WITH/EXPLAIN) pour inspecter les donnees.

## Quand Utiliser

Utiliser ce skill quand la demande contient:
- regarder dans la BDD / query DB / query database
- checker une table / verifier en base
- voir les donnees de... / montre-moi la table...
- SELECT ... FROM / combien de lignes dans...
- inspecter le schema / voir les colonnes / voir les FK
- lister les enums / contraintes / index

## Portails & Bases Disponibles

| Portail | Database | Host | Schemas principaux |
|---------|----------|------|--------------------|
| `lrgmedia` (defaut) | `portal_lrgmedia` | `34.47.5.151` | crm, finance, public |
| `comuse` | `portal_comuse` | `34.47.5.151` | public, crm, finance, customization |
| `demo` | `portal_demo` | `34.47.5.151` | crm, finance, public |
| `terrains_mauricie` | `portal_terrains_mauricie` | `34.47.5.151` | crm, finance, public |

## Source De Verite

Lire la config DB depuis:
- `portal-configs/<portal>.json`
- chemin: `security.database_config.development`
- Format URL: `postgresql://user:password@host:port/database`

Par defaut utiliser `lrgmedia` comme portail si non precise.

## Workflow Obligatoire

1. Determiner le portail (depuis le contexte ou la demande).
2. Lire le portal config pour extraire l'URL de connexion DB.
3. Parser l'URL pour obtenir: host, port, user, password, database.
4. Construire la commande psql avec `PGPASSWORD` pour l'auth.
5. Detecter le bon schema avant de requeter (voir section Schema Detection).
6. Executer la requete avec `psql -h host -p port -U user -d database -c "SQL"`.
7. Retourner les resultats de facon claire et structuree.

## Schema Detection (Important)

Les tables ne sont PAS toujours dans `crm.`. Chaque portal a ses schemas:

| Type de table | Schema | Exemples |
|---------------|--------|----------|
| CRM (accounts, contacts, leads) | `crm.` | `crm.accounts`, `crm.contacts` |
| Finance (invoices, payments, quotes) | `finance.` | `finance.invoices`, `finance.payments` |
| Portal-specific (inspections, etc.) | `public.` | `public.inspections` |
| System (users, settings, logs) | `public.` | `public.users`, `public.activity_logs` |
| Custom fields | `customization.` | `customization.custom_field_values` |

**Regle**: Si le schema n'est pas connu, d'abord lister les schemas (`\dn`) puis chercher la table avec `\dt *.<table>` ou `SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%<mot%'`.

## Commandes Modeles

### Voir la structure d'une table
```bash
PGPASSWORD=<pw> psql -h <host> -p <port> -U <user> -d <db> -c "\d <schema>.<table>"
```

### Voir les colonnes + types (format etendu)
```bash
PGPASSWORD=<pw> psql -h <host> -p <port> -U <user> -d <db> -c "\d+ <schema>.<table>"
```

### Compter les lignes
```bash
PGPASSWORD=<pw> psql -h <host> -p <port> -U <user> -d <db> -c "SELECT COUNT(*) FROM <schema>.<table>;"
```

### SELECT avec filtre
```bash
PGPASSWORD=<pw> psql -h <host> -p <port> -U <user> -d <db> -c "SELECT * FROM <schema>.<table> WHERE <condition> LIMIT 50;"
```

### Lister les schemas disponibles
```bash
PGPASSWORD=<pw> psql -h <host> -p <port> -U <user> -d <db> -c "\dn"
```

### Chercher une table dans tous les schemas
```bash
PGPASSWORD=<pw> psql -h <host> -p <port> -U <user> -d <db> -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%<mot>%' ORDER BY table_schema;"
```

### Voir les enums d'une DB
```bash
PGPASSWORD=<pw> psql -h <host> -p <port> -U <user> -d <db> -c "SELECT t.typname, e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid ORDER BY t.typname, e.enumsortorder;"
```

### Voir les FK/constraints d'une table
```bash
PGPASSWORD=<pw> psql -h <host> -p <port> -U <user> -d <db> -c "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = '<schema>.<table>'::regclass AND contype = 'f';"
```

### Voir les indexes d'une table
```bash
PGPASSWORD=<pw> psql -h <host> -p <port> -U <user> -d <db> -c "\di <schema>.<table>"
```

## Patterns de Query Courants (Projet)

### Jointure inspection ↔ account ↔ inspecteur
```sql
SELECT i.id, i.title, i.status, i.quarter, i.year,
       a.name AS account_name,
       u.name AS inspector_name
FROM public.inspections i
LEFT JOIN crm.accounts a ON i.account_id = a.id
LEFT JOIN public.users u ON i.inspector_id = u.id
LIMIT 50;
```

### Jointure invoice ↔ account ↔ owner
```sql
SELECT inv.id, inv.invoice_number, inv.status, inv.total,
       a.name AS account_name,
       u.name AS owner_name
FROM finance.invoices inv
LEFT JOIN crm.accounts a ON inv.account_id = a.id
LEFT JOIN public.users u ON inv.user_id = u.id
LIMIT 50;
```

### Compteur par status (inspection, invoice, etc.)
```sql
SELECT status, COUNT(*) AS count
FROM <schema>.<table>
WHERE deleted_at IS NULL
GROUP BY status
ORDER BY count DESC;
```

## Regles Securite

- **READ-ONLY**: Executer uniquement des SELECT, WITH, EXPLAIN. Jamais INSERT/UPDATE/DELETE/DROP.
- **Pas de credentials en durée**: Toujours lire depuis le portal config.
- **Limites**: Toujours `LIMIT 50` par defaut, `LIMIT 200` max sauf exception justifiee.
- **Schema auto**: Detecter le schema avant de requeter (pas toujours `crm.`).
