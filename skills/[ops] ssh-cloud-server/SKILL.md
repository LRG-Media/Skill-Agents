---
name: ops--ssh-cloud-server
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
| **Disque** | 200 Go (64% utilisé, ~74 Go libres) |
| **Nginx** | /usr/sbin/nginx (conf.d style, pas sites-enabled) |
| **Node.js** | v20+ |
| **PM2** | v6.0.8 |
| **Git** | v2.48.2 |
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
- SSL : `/etc/ssl/certs/cloud.lrgmedia.ca.crt`

### Structure Home Directories

```
/home/
├── portallrgmedia/    # LRG Media (public_html/ + server/)
├── portalcomuse/      # COMUSE
├── portaldemo/        # Demo
├── terrainsmauricie/  # Terrains Mauricie
└── ...
```

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
- `cat /etc/nginx/conf.d/users/<portal>.conf` : Config d'un portail

### Systeme
- `df -h` : Espace disque
- `free -m` : Mémoire
- `top -bn1 | head -20` : Processus
- `tail -f /var/log/nginx/error.log` : Logs Nginx

### Portails
- `ls /home/portal<name>/` : Structure d'un portail
- `cd /home/portal<name>/server && pm2 logs` : Logs backend
- `cd /home/portal<name>/public_html && ls` : Frontend

### WordPress (WP-CLI)
Pour toutes les opérations WordPress (updates, plugins, themes, DB, maintenance), utiliser le skill dédié : **wp-cli-server**.
Le mapping des 29+ sites WordPress et les commandes WP-CLI y sont documentés.
