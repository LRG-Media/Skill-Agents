---
name: backend-psql-explorer
description: 'Explorer la base de donnees PostgreSQL locale du portail via psql. A utiliser quand on demande: regarder dans la BDD, query DB, voir les donnees, checker une table, SELECT, verifier en base, inspecter le schema.'
argument-hint: 'Portail (optionnel, defaut: lrgmedia) puis requete SQL ou table a inspecter.'
user-invocable: true
---

# Backend PSQL Explorer

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
- verifier les donnees d'un portail

## Source De Verite

Lire la config DB depuis:
- `portal-configs/<portal>.json`
- chemin: `security.database_config.development`
- Format URL: `postgresql://user:password@host:port/database`

Par defaut utiliser `lrgmedia` comme portail si non precise.

## Scripts Disponibles

Le skill est accompagne de 3 scripts dans le dossier du skill :

### `db-explore.mjs` — Exploration complète
```bash
node .github/skills/backend-psql-explorer/db-explore.mjs <portal>
```
Affiche: schemas, tables avec COUNT(*) réel (pas pg_stat), enums. **Utiliser en premier.**

### `db-inspect.mjs` — Inspection table
```bash
node .github/skills/backend-psql-explorer/db-inspect.mjs <portal> <schema.table>
```
Affiche: colonnes+types, FK, indexes, triggers, RLS policies, 5 échantillons.

### `db-query.mjs` — Requête SQL arbitraire
```bash
node .github/skills/backend-psql-explorer/db-query.mjs [flags] [portal] "<SQL>"
```
Read-only par défaut (bloque INSERT/UPDATE/DELETE/DROP). Ajoute LIMIT 200 si absent.

**Flags:**
- `--write` : Autoriser les requêtes d'écriture (DELETE, UPDATE, INSERT, etc.)
- `--confirm` : Demander confirmation interactive avant une requête destructrice (DELETE, DROP, TRUNCATE)
- `--dry-run` : Afficher la requête sans l'exécuter
- `--no-limit` : Ne pas ajouter LIMIT 200 automatiquement
- `--output <fichier>` : Exporter les résultats en JSON vers un fichier
- `--format table|json|csv` : Format de sortie (défaut: table)

**Exemples:**
```bash
# Lecture classique
node .github/skills/backend-psql-explorer/db-query.mjs lrgmedia "SELECT * FROM crm.contacts LIMIT 10"

# Écriture avec confirmation
node .github/skills/backend-psql-explorer/db-query.mjs --write --confirm lrgmedia "DELETE FROM finance.subscriptions WHERE id = 40"

# Dry run pour vérifier avant exécution
node .github/skills/backend-psql-explorer/db-query.mjs --write --dry-run lrgmedia "DELETE FROM finance.subscriptions WHERE id = 40"

# Export JSON
node .github/skills/backend-psql-explorer/db-query.mjs --output result.json lrgmedia "SELECT * FROM finance.invoices"

# Format CSV
node .github/skills/backend-psql-explorer/db-query.mjs --format csv lrgmedia "SELECT id, name, status FROM finance.subscriptions"
```

**Important**: Si `pg` n'est pas installé globalement, utiliser le `node_modules` du projet serveur :
```bash
cd server && node .github/skills/backend-psql-explorer/db-query.mjs [flags] [portal] "<SQL>"
```

**Priorite**: Utiliser les scripts en priorite. Le fallback `node -e "..."` n'est qu'une alternative si les scripts ne sont pas disponibles.

## Workflow Obligatoire

1. Determiner le portail (depuis le contexte ou la demande).
2. Lire le portal config pour extraire l'URL de connexion DB.
3. Parser l'URL pour obtenir: host, port, user, password, database.
4. Verifier la disponibilite de `psql` (`which psql` ou `where psql`).
5. Si `psql` n'est pas installe, utiliser le **fallback Node.js** (voir section Fallback).
6. **Decouvrir les schemas** avant de requeter (voir Phase Exploration).
7. Pour les opérations d'écriture, utiliser `--write --confirm` avec `db-query.mjs` (ex: suppression, mise à jour).
8. Executer la requete et retourner les resultats de facon claire et structuree.

## Fallback Node.js (si psql absent)

Si `psql` n'est pas disponible sur la machine, utiliser le client Node.js `pg` :

```bash
node -e "const { Client } = require('pg'); const c = new Client({host:'<host>',port:<port>,user:'<user>',password:'<pw>',database:'<db>'}); c.connect().then(()=>c.query('<SQL>')).then(r=>{console.table(r.rows);c.end()}).catch(e=>{console.error(e.message);c.end()})"
```

**Important**: Si `pg` n'est pas installe globalement, utiliser le `node_modules` du projet serveur :
```bash
cd server && node -e "..."
```

## Phase Exploration (Decouvrir la base)

Avant de requeter sur des tables inconnues, **toujours explorer la base en premier**. Ne jamais supposer les schemas ou tables existants.

### Etape 1 — Lister les schemas
```bash
PGPASSWORD=<pw> psql -h <host> -p <port> -U <user> -d <db> -c "\dn"
```

### Etape 2 — Lister les tables par schema
```bash
PGPASSWORD=<pw> psql -h <host> -p <port> -U <user> -d <db> -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema') ORDER BY table_schema, table_name;"
```

### Etape 3 — Voir la structure d'une table
```bash
PGPASSWORD=<pw> psql -h <host> -p <port> -U <user> -d <db> -c "\d <schema>.<table>"
```

### Etape 4 — Voir les colonnes + types detailles
```bash
PGPASSWORD=<pw> psql -h <host> -p <port> -U <user> -d <db> -c "\d+ <schema>.<table>"
```

### Etape 5 — Voir les FK / contraintes
```bash
PGPASSWORD=<pw> psql -h <host> -p <port> -U <user> -d <db> -c "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = '<schema>.<table>'::regclass AND contype = 'f';"
```

### Etape 6 — Voir les indexes
```bash
PGPASSWORD=<pw> psql -h <host> -p <port> -U <user> -d <db> -c "\di <schema>.<table>"
```

### Etape 7 — Voir les enums
```bash
PGPASSWORD=<pw> psql -h <host> -p <port> -U <user> -d <db> -c "SELECT t.typname, e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid ORDER BY t.typname, e.enumsortorder;"
```

### Etape 8 — Compter les lignes d'une table
```bash
PGPASSWORD=<pw> psql -h <host> -p <port> -U <user> -d <db> -c "SELECT COUNT(*) FROM <schema>.<table>;"
```

## Requetes de Decouvertes Utiles

### Chercher une table par mot-cle dans tous les schemas
```sql
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name LIKE '%<motcle>%'
  AND table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema;
```

### Voir les colonnes d'une table (format info_schema)
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = '<schema>' AND table_name = '<table>'
ORDER BY ordinal_position;
```

### Voir les relations FK d'une table (sortie lisible)
```sql
SELECT
  kcu.column_name,
  ccu.table_schema AS foreign_schema,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = '<schema>'
  AND tc.table_name = '<table>';
```

### Voir les vues d'un schema
```bash
PGPASSWORD=<pw> psql -h <host> -p <port> -U <user> -d <db> -c "\dv <schema>.*"
```

### Voir les sequences d'un schema
```bash
PGPASSWORD=<pw> psql -h <host> -p <port> -U <user> -d <db> -c "\ds <schema>.*"
```

### Compter les lignes de toutes les tables d'un schema
```sql
SELECT schemaname||'.'||relname AS table_name
FROM pg_stat_user_tables
WHERE schemaname = '<schema>'
ORDER BY relname;
```
Puis pour chaque table, executer `SELECT COUNT(*) FROM <schema>.<table>;` individuellement.

> **ATTENTION**: `pg_stat_user_tables.n_live_tup` est une **estimation** qui peut etre tres erronee si autovacuum n'a pas tourne. **TOUJOURS** utiliser `COUNT(*)` pour les compteurs reels.

### Voir les trigger d'une table
```bash
PGPASSWORD=<pw> psql -h <host> -p <port> -U <user> -d <db> -c "\dT <schema>.<table>"
```

### Voir les politiques RLS d'une table
```sql
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = '<schema>' AND tablename = '<table>';
```

## Requetes Analytiques Courantes

### Compteur par colonne de status
```sql
SELECT status, COUNT(*) AS count
FROM <schema>.<table>
WHERE deleted_at IS NULL
GROUP BY status
ORDER BY count DESC;
```

### Dernieres entrees d'une table
```sql
SELECT * FROM <schema>.<table>
ORDER BY created_at DESC
LIMIT 20;
```

### Recherche textuelle sur une colonne
```sql
SELECT * FROM <schema>.<table>
WHERE <colonne> ILIKE '%<terme>%'
LIMIT 50;
```

## Regles Securite

- **READ-ONLY par défaut**: Les scripts bloquent les écritures par défaut. Utiliser `--write` pour autoriser INSERT/UPDATE/DELETE/DROP. Utiliser `--confirm` en complément pour les opérations destructives.
- **Pas de credentials en dur**: Toujours lire depuis le portal config.
- **Masquer les credentials**: Ne jamais afficher le mot de passe dans les commandes executees. Utiliser des variables ou tronquer la sortie si necessaire.
- **Limites**: Toujours `LIMIT 50` par defaut, `LIMIT 200` max sauf exception justifiee.
- **Exploration d'abord**: Ne jamais supposer le contenu d'une base — explorer avant de requeter.
- **COUNT(*) only**: Ne JAMAIS utiliser `pg_stat_user_tables.n_live_tup` pour les compteurs — c'est une estimation obsolète. TOUJOURS `SELECT COUNT(*)`.
