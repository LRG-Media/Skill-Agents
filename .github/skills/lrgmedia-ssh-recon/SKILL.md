---
name: lrgmedia-ssh-recon
description: 'Connexion SSH au serveur web LRG Media (WHM/cPanel), audit read-only de l environnement (PM2, Nginx, paths, comptes), et rapport structure. A utiliser quand on demande: connexion serveur web, SSH prod, diagnostic infra, check PM2/Nginx/cPanel/Imunify.'
argument-hint: 'Precise le portail (ex: lrgmedia), l environnement (production) et l objectif (audit global, pm2, nginx, logs, cpanel).'
user-invocable: true
---

# LRG Media SSH Recon

## Objectif

Se connecter au serveur web via SSH en mode securitaire (lecture seule) et produire un rapport fiable sur:
- environnement machine (hostname, OS, user)
- stack web (nginx/apache)
- process app (PM2)
- structure des chemins deployes
- contexte WHM/cPanel multi-comptes
- presence potentielle Imunify/Immunify
- exposition reseau externe des services critiques
- posture d acces admin (SSH/sudo)

## Quand Utiliser

Utiliser ce skill quand la demande contient:
- connecte-toi au serveur web
- connexion SSH production
- verifier PM2/nginx
- audit environment serveur
- diagnostic WHM/cPanel

## Source De Verite

Lire la config SSH depuis:
- `portal-configs/lrgmedia.json`
- chemin attendu: `deployment.ssh.production`

Ne pas hardcoder host/port/user si le fichier est disponible.

## Workflow Obligatoire

1. Charger la config SSH depuis le portal config.
2. Lancer un sous-agent `Explore` pour:
   - confirmer les conventions repo (deploy, pm2, nginx, paths)
   - proposer une sequence de commandes read-only adaptee
3. Tenter une connexion SSH en `BatchMode=yes` (non interactive) pour un preflight rapide.
4. Si auth echoue, basculer en mode interactif et demander a l utilisateur d entrer son secret directement dans le terminal.
5. Executer seulement des commandes de reconnaissance read-only.
6. Verifier aussi l exposition externe des ports critiques depuis la machine locale quand possible.
7. Retourner un rapport structure: confirme/probable/checklist/next steps.

## Profil Confirme (Snapshot 2026-05-29)

- Hostname: `cloud.lrgmedia.ca`
- OS: `AlmaLinux 9.6`, kernel `5.14.0-611.49.1.el9_7.x86_64`
- Cloud: `GCP`, machine `e2-standard-8`, zone `northamerica-northeast1-b`
- Acces SSH root fonctionnel en `BatchMode=yes`
- PM2 actif avec apps: `lrgmedia`, `comuse`, `demo`, `terrains_mauricie`, `mclim-sms-widget`
- Services web actifs: `nginx` + `httpd`
- WHM present (`whmapi1 version`: `11.126.0.54`)
- Comptes WHM detectes: `30`
- cPanel account `portallrgmedia` confirme (`main_domain`: `client.lrgmedia.ca`)
- DB detectees: `MariaDB 10.11.17`, `PostgreSQL 13.23`
- Imunify present (services + packages detectes)

## Alerts Connues (Dernier Audit)

- `CRITIQUE`: port `5432` visible depuis Internet.
- `ELEVE`: `PermitRootLogin yes` et `PasswordAuthentication yes`.
- `ELEVE`: firewalld zone `trusted` sur `eth0` avec target `ACCEPT`.
- `MOYEN`: `logrotate.service` en echec quotidien.
- `MOYEN`: `cphulkd` et `cpgreylistd` desactives/non monitorees.
- `MOYEN`: warnings `nginx -t` (conflits server_name + directives http2 depreciees).
- `FAIBLE`: swap sature (2G/2G) avec RAM disponible.

Ce profil sert de baseline et doit etre reverifie a chaque session SSH.

## Commandes Read-Only Recommandees

### Preflight

```bash
hostname; uname -a; whoami; pwd
```

### Dossiers applicatifs

```bash
ls -la /home
ls -la /home/portallrgmedia
ls -la /home/portallrgmedia/server | head -n 80
ls -la /home/portallrgmedia/public_html | head -n 80
```

### Process et services

```bash
command -v pm2 >/dev/null && pm2 list || echo PM2_ABSENT
systemctl is-active nginx
systemctl is-active httpd || systemctl is-active apache2
nginx -t 2>&1 | head -n 80
pm2 list
systemctl --failed --no-pager | head -n 80
```

### WHM/cPanel

```bash
command -v whmapi1 >/dev/null && whmapi1 --output=json version | head -n 80 || echo WHMAPI1_ABSENT
command -v whmapi1 >/dev/null && whmapi1 --output=json listaccts | head -n 120 || true
uapi --output=json --user=portallrgmedia DomainInfo list_domains | head -n 120
```

### Imunify/Immunify

```bash
systemctl list-unit-files | grep -Ei 'imunify|immunify' || true
rpm -qa | grep -Ei 'imunify|immunify' | head -n 40 || true
```

### Posture SSH et exposition externe

```bash
egrep -i '^(Port|PermitRootLogin|PasswordAuthentication|PubkeyAuthentication)' /etc/ssh/sshd_config | sed '/^#/d'
```

```powershell
$ports = 2222,5432,3306,3001,3002,3003,3004
foreach ($p in $ports) { (Test-NetConnection -ComputerName 34.47.5.151 -Port $p -WarningAction SilentlyContinue).TcpTestSucceeded }
```

## Example PowerShell Flow

```powershell
$cfg = Get-Content "portal-configs/lrgmedia.json" -Raw | ConvertFrom-Json
$ssh = $cfg.deployment.ssh.production
$host = $ssh.host
$port = $ssh.port
$user = $ssh.user
ssh -o BatchMode=yes -o ConnectTimeout=10 -p $port "$user@$host" "hostname; uname -a; whoami; pwd"
```

## Guardrails

- Strict read-only: aucune commande destructive.
- Interdit: `rm`, `mv`, `cp` (ecriture), `chmod`, `chown`, `systemctl restart`, `pm2 restart`, edition de fichiers.
- Ne jamais afficher les secrets du portal config dans la reponse.
- Si prompt mot de passe: l utilisateur tape lui-meme dans le terminal.
- Timeout court sur les commandes de reconnaissance.

## Sortie Attendue

Toujours retourner ces sections:

1. `Statut`: `OK` | `PARTIAL` | `BLOCKED`
2. `Ce qui est confirme`
3. `Ce qui est probable`
4. `Checklist audit`
5. `Next actions immediates`

Inclure dans `Ce qui est confirme`:
- statut SSH (BatchMode)
- statut PM2 (`lrgmedia` online ou non)
- statut `nginx`/`httpd`
- version WHM detectee
- statut Imunify detecte/non detecte
- statut exposition externe des ports critiques
- severite des constats (`CRITIQUE`, `ELEVE`, `MOYEN`, `FAIBLE`)

## Checklist Audit Standard

- Identite machine confirmee
- Compte/paths portail valides
- PM2 app observee
- Nginx/Apache statut confirme
- Validation `nginx -t` capturee
- Presence WHM/cPanel confirmee
- Presence Imunify/Immunify verifiee
- Aucun changement ecriture applique
- Warnings `nginx -t` captures (ex: `listen ... http2` deprecated)
