---
name: wordpress--wp-cli-server
description: 'Gestion WordPress via WP-CLI sur le serveur cloud. Mise à jour core/plugins/themes de TOUS les sites (27+), gestion BDD, diagnostic, sync contenu, maintenance. Validation post-update obligatoire pour chaque site. Backups gérés séparément via Google Drive. Script d update : wp_update_all.sh (upload → exécution → nettoyage).'
argument-hint: 'Site WordPress cible (ex: terrainsmauricie, lrgmedia, "tous") ou action (update, validate, list, status, db). "Tous" = traiter les 27+ sites sans exception.'
user-invocable: true
---

# WP-CLI Server

## Objectif

Exécuter des opérations WordPress via WP-CLI sur le serveur cloud via SSH. Ce skill complète l'intégration REST API existante (`WordPressApiClient`) en offrant un accès admin direct aux sites WordPress.

## Prérequis

- SSH accessible sur `34.47.5.151:2222` (user: `root`)
- WP-CLI v2.12.0 installé : `/usr/local/bin/wp`
- PHP 8.4.15 (`/opt/cpanel/ea-php84/root/usr/bin/php`)
- MariaDB 10.11.18

## Règles de Sécurité

1. **JAMAIS** de `--all` sans confirmation explicite de l'utilisateur
2. **TOUJOURS** vérifier l'URL cible avec `wp option get siteurl` avant update
3. Les commandes `wp db` sont **irréversibles** → demander confirmation
4. Ne pas exécuter `wp plugin install` sans vérifier la source
5. Utiliser `--skip-themes` et `--skip-plugins` pour les diagnostics si nécessaire

## Mapping Sites → Paths

| Site | Path WordPress |
|------|---------------|
| `terrainsmauricie` | `/home/terrainsmauricie/public_html/` |
| `lrgmedia` | `/home/lrgmedia/public_html/` |
| `pnp` | `/home/pnp/public_html/` |
| `buffetlise` | `/home/buffetlise/public_html/` |
| `droletsimard` | `/home/droletsimard/boisdroletsimard.com/` |
| `droletsimard-staging` | `/home/droletsimard/staging.droletsimard.com/` |
| `jolygateries` | `/home/jolygateries/public_html/` |
| `cotelafo` | `/home/cotelafo/public_html/` |
| `mclim` | `/home/mclim/public_html/` |
| `admindatainc` | `/home/admindatainc/public_html/` |
| `sciagedebetonai` | `/home/sciagedebetonai/public_html/` |
| `campinglacmagog` | `/home/campinglacmagog/public_html/` |
| `campinglacmagog-dev` | `/home/campinglacmagog/dev.campinglacmagog.ca/` |
| `firmebrouillette` | `/home/firmebrouillette/public_html/` |
| `bonpasteursher` | `/home/bonpasteursher/public_html/` |
| `minilab` | `/home/minilab/public_html/` |
| `taillagedehaies` | `/home/taillagedehaies/public_html/` |
| `absoluresidence` | `/home/absoluresidence/public_html/` |
| `ficelle` | `/home/ficelle/public_html/` |
| `comuse` | `/home/comuse/public_html/` |
| `lecoinapat` | `/home/lecoinapat/public_html/` |
| `csaentreprise` | `/home/csaentreprise/public_html/` |
| `renoverexpert` | `/home/renoverexpert/designer.expert/` |
| `projetlrgmedia` | `/home/projetlrgmedia/public_html/` |
| `projetlrgmedia-lrg` | `/home/projetlrgmedia/lrg.projet.lrgmedia.ca/` |
| `projetlrgmedia-absolu` | `/home/projetlrgmedia/absolu.projet.lrgmedia.ca/` |
| `mvmtdigital-dev` | `/home/mvmtdigital/dev.mvmtdigital.com/` |

> **Règle** : Si le site n'est pas listé, chercher avec `find /home -maxdepth 2 -name 'wp-config.php'` sur le serveur.

## Template de commande SSH

```bash
ssh -o BatchMode=yes -p 2222 root@34.47.5.151 "cd <WP_PATH> && wp <COMMAND> --allow-root --no-color 2>&1"
```

**Flags constants :**
- `--allow-root` : nécessaire car connexion en root
- `--no-color` : sortie brute pour parsing
- `2>&1` : capturer stderr aussi

## Commandes Fréquentes

### Diagnostic
```bash
# Info générale du site
wp --info --allow-root --no-color

# Vérifier URL du site
wp option get siteurl --allow-root --no-color

# Version WP core
wp core version --allow-root --no-color

# Status complet
wp core version --allow-root --no-color && wp plugin list --allow-root --no-color | head -5 && wp theme list --allow-root --no-color | head -5

# Vérifier si une mise à jour est disponible
wp core check-update --allow-root --no-color
wp plugin check-update --allow-root --no-color
wp theme check-update --allow-root --no-color
```

### Mises à jour (core)
```bash
# Update core WordPress
wp core update --allow-root --no-color

# Update core + DB
wp core update-db --allow-root --no-color

# Vérifier version après update
wp core version --allow-root --no-color
```

### Mises à jour (plugins)
```bash
# Lister tous les plugins et versions
wp plugin list --allow-root --no-color

# Update tous les plugins
wp plugin update --all --allow-root --no-color

# Update un plugin spécifique
wp plugin update <plugin-slug> --allow-root --no-color

# Activer/Désactiver
wp plugin activate <plugin-slug> --allow-root --no-color
wp plugin deactivate <plugin-slug> --allow-root --no-color

# Installer un plugin
wp plugin install <plugin-slug> --activate --allow-root --no-color
```

### Mises à jour (themes)
```bash
# Lister les thèmes
wp theme list --allow-root --no-color

# Update tous les thèmes
wp theme update --all --allow-root --no-color

# Update un thème spécifique
wp theme update <theme-slug> --allow-root --no-color
```

### Base de données
```bash
# Info DB
wp db info --allow-root --no-color

# Tables
wp db tables --allow-root --no-color

# Optimiser tables
wp db optimize --allow-root --no-color

# Réparer tables
wp db repair --allow-root --no-color

# Recherche dans la DB
wp db search <terme> --all-tables --allow-root --no-color
```

### Utilisateurs
```bash
# Lister les users
wp user list --allow-root --no-color

# Info d'un user
wp user get <ID> --allow-root --no-color

# Créer un user admin
wp user create <login> <email> --role=administrator --allow-root --no-color
```

### Contenu
```bash
# Lister les posts
wp post list --post_type=post --post_status=publish --allow-root --no-color

# Lister les pages
wp post list --post_type=page --post_status=publish --allow-root --no-color

# Export
wp export --dir=/tmp/export/ --allow-root --no-color
```

### Cron
```bash
# Vérifier les cron jobs
wp cron event list --allow-root --no-color

# Lancer un cron manuellement
wp cron event run <hook> --allow-root --no-color

# Clear le cron
wp cron event delete --all --allow-root --no-color
```

### Cache & Performance
```bash
# Purger le cache object
wp cache flush --allow-root --no-color

# Purger le cache de WP Super Cache / W3TC / etc.
wp supercache flush --allow-root --no-color  # si plugin installé

# Transients
wp transient delete --all --allow-root --no-color
```

### Maintenance
```bash
# Mode maintenance ON
wp maintenance-mode activate --allow-root --no-color

# Mode maintenance OFF
wp maintenance-mode deactivate --allow-root --no-color

# Vérifier status
wp maintenance-mode status --allow-root --no-color
```

## Workflow : Update complet d'un site

```
1. Diagnostic initial
   → wp core version + wp plugin list + wp theme list
   → Sauvegarder les versions actuelles

2. Update core
   → wp core update
   → wp core update-db

3. Update plugins
   → wp plugin update --all

4. Update themes
   → wp theme update --all

5. Purge cache
   → wp cache flush
   → wp transient delete --all

6. Validation post-update (OBLIGATOIRE)
   → Voir section « Validation Post-Update » ci-dessous

7. Rapport
   → Comparer avant/après
   → Noter les échecs éventuels
   → Confirmer ou annuler le status de validation
```

## Workflow : Update en masse (tous les sites)

> **IMPORTANT** : « Mettre à jour tous les sites » signifie **TOUS les sites WordPress** du serveur (27+ installations), pas seulement ceux dont la version est obsolète. Même si un site est déjà à jour, il faut quand même exécuter la validation pour s'assurer qu'il fonctionne correctement.

### Procédure d'exécution

```
1. Upload du script sur le serveur
   → scp -P 2222 <chemin_local>/wp_update_all.sh root@34.47.5.151:/tmp/wp_update_all.sh

2. Exécuter le script
   → ssh -p 2222 root@34.47.5.151 "bash /tmp/wp_update_all.sh"

3. Supprimer les fichiers temporaires APRÈS exécution
   → ssh -p 2222 root@34.47.5.151 "rm -f /tmp/wp_update_all.sh /tmp/wp_update_*.log"
```

### Détail des étapes

````
1. Lister TOUS les sites WordPress
   → find /home -maxdepth 3 -name 'wp-config.php' -exec dirname {} \;
   → Ignorer les dossiers : admin, admin_, cPanelInstall, git, latest, louka, virtfs

2. Pour CHAQUE site (sans exception), exécuter en séquence :
   a. wp core version (version actuelle)
   b. wp core check-update (updates disponibles ?)
   c. wp core update + wp core update-db
   d. wp plugin update --all
   e. wp theme update --all
   f. wp cache flush + wp transient delete --all
   g. VALIDATION (obligatoire) → voir section Validation Post-Update

3. Si un site échoue :
   → Noter l'erreur
   → Passer au site suivant
   → Réessayer le site en échec en fin de session

4. Rapport consolidé avec status de CHAQUE site
   → Tableau : Site | URL | Version Avant | Version Après | Plugins OK | Themes OK | Validation | Erreurs
   → Total sites traités / total sites trouvés
````

## Patterns d'Analyse

### Lister tous les sites WordPress (pour update complet)
```bash
# Lister tous les wp-config.php (exclure les dossiers système)
ssh -p 2222 root@34.47.5.151 "find /home -maxdepth 3 -name 'wp-config.php' -exec dirname {} \;" | grep -v -E '/(admin|admin_|cPanelInstall|git|latest|louka|virtfs)/'

# Compter les sites
ssh -p 2222 root@34.47.5.151 "find /home -maxdepth 3 -name 'wp-config.php' -exec dirname {} \;" | wc -l
```

### Site non listé dans le mapping
```bash
ssh -p 2222 root@34.47.5.151 "find /home -maxdepth 3 -name 'wp-config.php' -exec dirname {} \;"
```

### Vérifier la santé d'un site
```bash
ssh -p 2222 root@34.47.5.151 "cd <WP_PATH> && wp core version --allow-root --no-color && wp plugin list --allow-root --no-color | grep -c 'active' && wp theme list --allow-root --no-color | grep -c 'active'"
```

### Comparer versions avant/après update
```bash
# Avant
ssh -p 2222 root@34.47.5.151 "cd <WP_PATH> && wp core version --allow-root --no-color && wp plugin list --format=csv --allow-root --no-color" > /tmp/before_<site>.txt

# Après
ssh -p 2222 root@34.47.5.151 "cd <WP_PATH> && wp core version --allow-root --no-color && wp plugin list --format=csv --allow-root --no-color" > /tmp/after_<site>.txt

diff /tmp/before_<site>.txt /tmp/after_<site>.txt
```

## Validation Post-Update (OBLIGATOIRE)

**Règle** : Toute mise à jour doit être suivie d'une validation complète. Si la validation échoue, **alerter immédiatement** et proposer un rollback.

### Étape 1 — Vérification HTTP

```bash
# Test 1 : Status HTTP (doit retourner 200)
curl -sI -o /dev/null -w "%{http_code}" https://<SITE_URL>

# Test 2 : Temps de réponse (doit être < 5s)
curl -sI -o /dev/null -w "%{time_total}s" https://<SITE_URL>

# Test 3 : Headers de sécurité
curl -sI https://<SITE_URL> | grep -iE "x-frame-options|content-security-policy|strict-transport"

# Test 4 : Pas de erreur PHP fatale dans le HTML
curl -s https://<SITE_URL> | grep -ci "fatal error\|white screen\|wsod\|debug.log"

# Test 5 : Pas de erreur 500 interne
curl -sI https://<SITE_URL> | grep -c "^HTTP/.* 5[0-9][0-9]"
```

**Résultat attendu :**
- HTTP 200
- Temps < 5s
- Pas de "Fatal error" / "White Screen of Death"
- Pas de 5xx

### Étape 2 — Vérification WP-CLI

```bash
# Health check WordPress intégré
wp health-check run --allow-root --no-color 2>&1

# Vérifier que le site n'est pas en mode maintenance
wp maintenance-mode status --allow-root --no-color

# Vérifier les erreurs de DB
wp db check --allow-root --no-color

# Vérifier les options critiques
wp option get siteurl --allow-root --no-color
wp option get blogname --allow-root --no-color
wp option get active_plugins --allow-root --no-color | head -5
```

### Étape 3 — Vérification logs PHP

```bash
# Dernières erreurs PHP (5 dernières minutes)
ssh -p 2222 root@34.47.5.151 "tail -50 /home/<SITE>/public_html/wp-content/debug.log 2>/dev/null || echo 'Pas de debug.log'"

# Erreurs PHP récentes dans le log système
ssh -p 2222 root@34.47.5.151 "journalctl -u php-fpm --since '5 minutes ago' --no-pager 2>/dev/null | tail -20 || echo 'Pas d accès journalctl'"

# Erreurs Nginx récentes
ssh -p 2222 root@34.47.5.151 "tail -10 /var/log/nginx/error.log 2>/dev/null | grep -i '<SITE>' || echo 'Pas d erreur Nginx pour ce site'"
```

### Étape 4 — Vérification plugins critiques

```bash
# Lister les plugins actifs et vérifier leur status
wp plugin list --status=active --allow-root --no-color

# Vérifier qu'il n'y a pas de plugins avec des mises à jour échouées
wp plugin list --fields=name,status,update --allow-root --no-color | grep -i "available\|error"
```

### Étape 5 — Test fonctionnel basique

```bash
# Tester que la page d'accueil charge du contenu (pas de blanc)
curl -s https://<SITE_URL> | grep -c "<body"

# Tester qu'une page interne est accessible (si connue)
curl -sI https://<SITE_URL>/wp-admin/ | grep -c "302\|200"
```

### Rapport de Validation

Pour chaque site validé, produire un tableau :

```
| Site | HTTP | WP Health | Logs | Plugins | Fonctionnel | Status |
|------|------|-----------|------|---------|-------------|--------|
| lrgmedia | ✅ 200 | ✅ OK | ✅ Clean | ✅ OK | ✅ OK | ✅ PASS |
| pnp | ✅ 200 | ⚠️ Warning | ✅ Clean | ✅ OK | ✅ OK | ⚠️ WARN |
| demo | ❌ 500 | ❌ FAIL | ❌ Errors | ⚠️ Update failed | ❌ FAIL | ❌ FAIL |
```

**Légende :**
- ✅ PASS = Validation complète réussie
- ⚠️ WARN = Avertissements non bloquants (vérifier manuellement)
- ❌ FAIL = Problème détecté → ALERTE + rollback possible

### Rollback en cas d'échec

Si la validation échoue après un update :

```bash
# 1. Rollback du core WP (si possible)
wp core update --version=<ancienne_version> --allow-root --no-color

# 2. Rollback des plugins (désactiver les défectueux)
wp plugin deactivate <plugin-defectueux> --allow-root --no-color

# 3. Purger le cache
wp cache flush --allow-root --no-color

# 4. Re-valider
curl -sI https://<SITE_URL> | head -1
```

## Relation avec l'Architecture existante

| Composant | Couverture |
|-----------|-----------|
| `WordPressApiClient` (REST API) | CRUD posts, pages, médias via API REST WP |
| `WordPressTokenManager` | Auth Basic App Passwords pour REST API |
| `WordPressConfigService` | Config stockée en DB via ConfigManager |
| **WP-CLI (ce skill)** | Admin serveur : updates core/plugins/themes de TOUS les sites, DB, maintenance, diagnostic |

**Règle** : Utiliser REST API pour les opérations CRUD métier (créer/modifier/supprimer du contenu depuis Node.js). Utiliser WP-CLI pour l'administration serveur (updates, DB, cache, maintenance).

## Portée de ce skill

Ce skill couvre **toutes les 27+ installations WordPress** du serveur cloud, incluant :
- Sites principaux (lrgmedia, pnp, terrainsmauricie, etc.)
- Sites staging/development (staging.droletsimard.com, dev.campinglacmagog.ca, etc.)
- Sous-domaines (lrg.projet.lrgmedia.ca, absolu.projet.lrgmedia.ca, etc.)
- Sites multi-domaines (droletsimard avec boisdroletsimard.com + staging)

**Exclure** : Les dossiers système (admin, admin_, cPanelInstall, git, latest, louka, virtfs)

## Erreurs Courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Error: This does not seem to be a WordPress installation` | Mauvais path | Vérifier avec `find /home -name 'wp-config.php'` |
| `Error: `wp-config.php` not found` | Path incorrect ou subdir | Chercher le bon `wp-config.php` |
| `connection timed out` | SSH non accessible | Vérifier IP/port, firewall |
| `Error: Access denied` | Permissions | Vérifier `--allow-root` |
| `Error: WordPress database error` | DB corrompue ou credentials | Vérifier `wp db info` |
| `Access denied for user ... (using password: YES)` | Credentials DB invalides dans wp-config.php | Vérifier les credentials dans le wp-config.php du site |
| HTTP 500 après update | Plugin/core incompatible | Rollback DB + désactiver plugins |
| White Screen of Death | PHP fatal error | Vérifier `debug.log`, rollback |
| `cURL error 28` (timeout) | Site injoignable | Vérifier Nginx, PHP-FPM, firewall |
| Erreur après update plugin | Version PHP incompatible | `wp plugin deactivate <slug>`, vérifier version PHP requise |
| `Le téléchargement a échoué. "Unauthorized"` | Plugin premium sans licence valide | Mettre à jour manuellement ou contacter le propriétaire |
| `PCLZIP_ERR_BAD_FORMAT` | Archive corrompue | Réessayer ou télécharger manuellement |
| Plugin update failed | Licence expirée ou API tierce inaccessible | Noter le plugin, continuer avec les autres sites |

## Règles pour l'update en masse

1. **Traiter TOUS les sites** — ne pas sauter un site même s'il est déjà à jour
2. **Continuer en cas d'erreur** — ne pas bloquer sur un site défaillant
3. **Noter les échecs** — documenter chaque échec dans le rapport final
4. **Réessayer les échecs** — en fin de session, retenter les sites en erreur
5. **Validation systématique** — chaque site doit être validé après update
