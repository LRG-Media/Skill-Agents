---
name: local-db-query
description: 'Requeter la base de donnees PostgreSQL locale du portail. A utiliser quand on demande: regarder dans la BDD, query DB, voir les donnees, checker une table, SELECT, verifier en base.'
argument-hint: 'Le portail (ex: lrgmedia) et la requete SQL ou la table a inspecter.'
user-invocable: true
---

# Local DB Query

## Objectif

Se connecter a la base PostgreSQL locale du portail et executer des requetes SQL en lecture seule (SELECT/WITH) pour inspecter les donnees.

## Quand Utiliser

Utiliser ce skill quand la demande contient:
- regarder dans la BDD
- query DB / query database
- checker une table
- voir les donnees de...
- SELECT ... FROM
- verifier en base
- combien de lignes dans...
- montre-moi le contenu de la table...

## Source De Verite

Lire la config DB depuis:
- `portal-configs/<portal>.json`
- chemin: `security.database_config.development`
- Format URL: `postgresql://user:password@host:port/database`

Par defaut utiliser `lrgmedia` comme portail si non precise.

## Workflow Obligatoire

1. Lire le portal config pour extraire l'URL de connexion DB.
2. Parser l'URL pour obtenir: host, port, user, password, database.
3. Construire la commande psql avec `PGPASSWORD` pour l'auth.
4. Executer la requete avec `psql -h host -p port -U user -d database -c "SQL"`.
5. Pour les tables CRM, prefixer avec le schema `crm.` (ex: `crm.accounts`).
6. Toujours ajouter `LIMIT 50` sauf si l'utilisateur precise un autre limite.
7. Retourner les resultats de facon claire et structuree.

## Commandes Modeles

### Voir la structure d'une table
```bash
PGPASSWORD=<password> psql -h <host> -p <port> -U <user> -d <database> -c "\d crm.<table>"
```

### Compter les lignes
```bash
PGPASSWORD=<password> psql -h <host> -p <port> -U <user> -d <database> -c "SELECT COUNT(*) FROM crm.<table>;"
```

### SELECT avec filtre
```bash
PGPASSWORD=<password> psql -h <host> -p <port> -U <user> -d <database> -c "SELECT * FROM crm.<table> WHERE <condition> LIMIT 50;"
```

### Voir les schemas disponibles
```bash
PGPASSWORD=<password> psql -h <host> -p <port> -U <user> -d <database> -c "\dn"
```

## Regles Securite

- **READ-ONLY**: Executer uniquement des SELECT, WITH, EXPLAIN. Jamais INSERT/UPDATE/DELETE/DROP.
- **Pas de credentials en durée**: Toujours lire depuis le portal config.
- **Limites**: Toujours `LIMIT 50` par defaut, `LIMIT 200` max sauf exception justifiee.
- **Schema CRM**: Les tables CRM sont dans le schema `crm.` (pas `public.`).

## Config par defaut (lrgmedia)

- Host: `34.47.5.151`
- Port: `5432`
- User: `admin`
- Database: `portal_lrgmedia`
- Schema principal: `crm`
