---
name: cloud-ssh-server
description: 'Gestion des connexions SSH et administration du serveur cloud. Execution de commandes, gestion des services (PM2, Nginx), transferts de fichiers et maintenance.'
argument-hint: 'Precise le portail (ex: lrgmedia), la commande ou l action souhaitee (exec, status, logs, deploy).'
user-invocable: true
---

# SSH Cloud Server

## Objectif

Agir comme l administrateur SSH principal pour les serveurs cloud du projet. Ce skill gere les connexions, execute les commandes distantes, maintient les services et assure le deploiement.

## Fonctionnalites

- **Connexion securisee** : Gestion automatique des cles SSH et mots de passe via les configs portail.
- **Execution de commandes** : Lancement de commandes shell sur le serveur distant.
- **Gestion des services** : Controle de PM2 (start, stop, restart, logs) et verification de Nginx.
- **Deploiement** : Mise a jour du code et gestion des releases.
- **Transferts** : Upload/Download de fichiers via SCP/SFTP si necessaire.
- **Diagnostic** : Consultation des logs systeme et applicatifs.

## Source De Verite

### Infrastructure Serveur

| Composant | Valeur |
|-----------|--------|
| **OS** | AlmaLinux 9.6 (Sage Margay) - RHEL-like |
| **Hostname** | cloud.lrgmedia.ca |
| **CPU** | 4 cœurs |
| **RAM** | 15 Go total (~11 Go disponibles) |
| **Disque** | 200 Go (42% utilisé, ~115 Go libres) |
| **Nginx** | /usr/sbin/nginx (conf.d style, pas sites-enabled) |
| **PHP** | v8.4.15 (EA4) |
| **PHP-FPM** | ea-php84-php-fpm (4 workers) |
| **Node.js** | v20+ |
| **PM2** | v6.0.8 |
| **Git** | v2.48.2 |
| **Redis** | v6.2.22 (localhost:6379) |
| **SSL** | Certificats custom dans /etc/ssl/certs/ |

### Processus PM2 Actifs

| ID | Nom | Portail | Mémoire |
|----|-----|---------|---------|
| 0 | lrgmedia | LRG Media | ~136 Mo |
| 1 | comuse | COMUSE | ~219 Mo |
| 2 | mclim-sms-widget | MCLim | ~30 Mo |
| 3 | demo | Demo | ~108 Mo |
| 4 | terrains_mauricie | Terrains Mauricie | ~88 Mo |

### Structure Nginx

- Config principale : `/etc/nginx/conf.d/`
- Configs portails : `/etc/nginx/conf.d/users/<portal>.conf`
- Modules : `/etc/nginx/conf.d/modules/`
- Includes : `/etc/nginx/conf.d/includes-optional/`
- SSL : `/etc/ssl/certs/cloud.lrgmedia.ca.crt`

### Optimisations Nginx (actives)

| Paramètre | Valeur | Fichier |
|-----------|--------|---------|
| `worker_processes` | `auto` (4 workers) | nginx.conf |
| `worker_connections` | `4096` | nginx.conf |
| `ssl_session_cache` | `shared:SSL:50m` | nginx.conf |
| `ssl_session_tickets` | `on` | nginx.conf |
| `ssl_session_timeout` | `1d` | nginx.conf |
| `brotli` | `on` (level 6) | nginx.conf |
| `gzip` | `on` (level 6) | nginx.conf |
| `open_file_cache` | `max=10000 inactive=20s` | nginx.conf |
| `keepalive_timeout` | `30` | nginx.conf |
| `sendfile` | `on` | nginx.conf |
| `tcp_nopush` | `on` | nginx.conf |
| `tcp_nodelay` | `on` | nginx.conf |

### Cache Nginx

| Paramètre | Valeur |
|-----------|--------|
| **Proxy cache** | `/var/cache/ea-nginx/proxy/` |
| **Cache TTL** | 60 minutes |
| **Cache valid** | 200, 301, 302 |
| **Cache stale** | error, timeout, 429, 500, 502, 503, 504 |

### PHP OPcache (production)

| Paramètre | Valeur | Impact |
|-----------|--------|--------|
| `validate_timestamps` | `0` (OFF) | Pas de vérification fichiers |
| `validate_permission` | `0` (OFF) | Pas de vérification permissions |
| `memory_consumption` | `512 MB` | Plus de cache |
| `max_accelerated_files` | `10000` | Plus de scripts |
| `fast_shutdown` | `1` (ON) | Démarrage rapide |
| `enable_file_override` | `1` (ON) | Optimisation file_exists() |

### Structure Home Directories

```
/home/
├── portallrgmedia/    # LRG Media (public_html/ + server/)
├── portalcomuse/      # COMUSE
├── portaldemo/        # Demo
├── terrainsmauricie/  # Terrains Mauricie
├── pnp/               # Productions Noeud Papillon
├── jolygateries/      # Joly Gateries
├── ficelle/           # Ficelle et Baluchon
└── ...
```

### Redis (Object Cache)

| Paramètre | Valeur |
|-----------|--------|
| **Host** | `127.0.0.1` |
| **Port** | `6379` |
| **Status** | `active` |
| **Used by** | LiteSpeed Cache (object cache) |

### LiteSpeed Cache (WordPress)

| Paramètre | Valeur |
|-----------|--------|
| **Plugin** | v7.8.1 |
| **Page cache** | Actif (3600s TTL) |
| **Browser cache** | Actif |
| **CSS/JS optimization** | Activé |
| **Image optimization** | Activé (WebP) |
| **Object cache** | Redis |

### Configuration SSH

```json
"ssh": {
  "production": {
    "host": "34.47.5.151",
    "port": 2222,
    "user": "root"
  }
}
```

**Regles :**
- Ne jamais hardcoder les mots de passe dans les commandes (utiliser SSH keys).
- Utiliser ces valeurs par defaut pour toutes les connexions sauf indication contraire.
- Le serveur gere plusieurs processus PM2 pour les differents portails.

## Workflow Standard

1. **Identification** : Determiner le portail cible et charger la config SSH.
2. **Pre-flight** : Verifier la connectivite (`ssh -o BatchMode=yes`).
3. **Authentification** :
    - Si echec en BatchMode, demander a l utilisateur d entrer sa cle ou son secret dans le terminal.
    - Utiliser `ssh-agent` si possible.
4. **Execution** : Lancer la commande demandee avec les options de securite appropriees (`-o StrictHostKeyChecking=no` si premier contact).
5. **Retour** : Fournir la sortie brute ou formatee selon le contexte.

## Commandes Fréquentes

### PM2
- `pm2 list` : Liste des processus
- `pm2 logs <app>` : Logs d'une app
- `pm2 restart <app>` : Redémarrer
- `pm2 monit` : Monitor en temps réel

### Nginx
- `nginx -t` : Tester config
- `systemctl reload nginx` : Recharger config
- `systemctl restart nginx` : Redémarrer (attention: perte connexions)
- `cat /etc/nginx/conf.d/users/<portal>.conf` : Config d'un portail
- `nginx -T 2>/dev/null | grep "brotli on"` : Vérifier Brotli

### Redis
- `redis-cli ping` : Tester connectivité
- `redis-cli info memory` : Utilisation mémoire
- `redis-cli dbsize` : Nombre de clés

### PHP OPcache
- `php -i | grep "opcache.validate_timestamps"` : Vérifier config
- `php -r "echo json_encode(opcache_get_status(false), JSON_PRETTY_PRINT);"` : Status complet

### Systeme
- `df -h` : Espace disque
- `free -m` : Mémoire
- `top -bn1 | head -20` : Processus
- `tail -f /var/log/nginx/error.log` : Logs Nginx
- `systemctl is-active nginx httpd redis` : Vérifier services

### Portails
- `ls /home/portal<name>/` : Structure d'un portail
- `cd /home/portal<name>/server && pm2 logs` : Logs backend
- `cd /home/portal<name>/public_html && ls` : Frontend

### WordPress (WP-CLI)
Pour toutes les opérations WordPress (updates, plugins, themes, DB, maintenance), utiliser le skill dédié : **wp-cli-server**.
Le mapping des 29+ sites WordPress et les commandes WP-CLI y sont documentés.

## Maintenance Nginx

### Logs
- **Location** : `/var/log/nginx/` et `/var/log/nginx/domains/`
- **Rotation** : Gérée par logrotate
- **Nettoyage** : `find /var/log/nginx/domains/ -type f -delete` (321 fichiers max)
- **Taille max** : ~1.5 Go avant nettoyage

### Cache
- **Location** : `/var/cache/ea-nginx/proxy/`
- **Nettoyage** : `rm -rf /var/cache/ea-nginx/proxy/*`
- **Taille max** : ~1 Go (25 sites)

### Permissions
- **Config files** : `644` (rw-r--r--)
- **Modules** : `644` (rw-r--r--)
- **SSL certs** : `600` (rw-------)

### Backups
- **Location** : `/etc/nginx/nginx.conf.bak-*`
- **Rétention** : 1 backup suffit
- **Nettoyage** : `rm -f /etc/nginx/nginx.conf.bak-*`
