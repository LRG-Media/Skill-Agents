---
name: cloud-nginx-log-analyzer
description: 'Analyser les logs d accès Nginx pour détecter les IPs suspectes, les patterns d attaque et proposer des règles fail2ban. Peut aussi mettre à jour automatiquement les filtres fail2ban.'
argument-hint: 'Analyse complète des logs, ou IP spécifique à investiguer (ex: 158.158.41.79).'
user-invocable: true
---

# Nginx Log Analyzer

## Objectif

Analyser les logs d'accès Nginx pour :
1. **Détecter** les IPs suspectes (scanners, brute-force, webshells)
2. **Classifier** les patterns d'attaque
3. **Tester** les filtres fail2ban existants
4. **Mettre à jour** les filtres si des patterns manquent

## Quand Utiliser

- Après une session de monitoring serveur
- Quand on soupçonne une attaque
- Pour auditer les filtres fail2ban existants
- En fin de session pour détecter de nouveaux patterns

## Workflow

### Pré-requis : Récupérer les fichiers localement

**Règle d'or** : Toujours télécharger les fichiers du serveur pour les analyser localement, puis réimporter les modifications via `scp`. Cela permet :
- D'analyser les fichiers avec plus de confort (pas de troncation SSH)
- De conserver une copie locale pour référence
- De nettoyer les fichiers temporaires à la fin

```bash
# Créer un dossier temporaire local
mkdir -p /tmp/nginx-analysis

# Télécharger le log d'accès
scp -P 2222 root@34.47.5.151:/var/log/nginx/access.log /tmp/nginx-analysis/access.log

# Télécharger les filtres fail2ban (si analyse nécessaire)
scp -P 2222 root@34.47.5.151:/etc/fail2ban/filter.d/nginx-*.conf /tmp/nginx-analysis/

# Télécharger la config fail2ban
scp -P 2222 root@34.47.5.151:/etc/fail2ban/jail.local /tmp/nginx-analysis/jail.local
```

### Étape 1 : Scan des logs (analyse locale)

```bash
# Analyse locale du log téléchargé
echo "=== VOLUME ===" && wc -l /tmp/nginx-analysis/access.log
echo "=== TOP IPs ===" && awk '{print $1}' /tmp/nginx-analysis/access.log | sort | uniq -c | sort -rn | head -15
echo "=== STATUS ===" && awk '{print $9}' /tmp/nginx-analysis/access.log | sort | uniq -c | sort -rn
echo "=== SUSPECT URLS ===" && awk '{print $7}' /tmp/nginx-analysis/access.log | grep -icE "php|env|git|config|login|admin|shell|cmd|c99|r57|wp-config|xmlrpc|\.bak|\.sql|\.log"
```

**Seuil d'alerte** : IPs > 50 requêtes OU patterns suspects > 100 hits.

**Vérification `fail2ban-regex` local** : Si l'outil n'est pas installé en local (Windows), passer directement au test SSH (Étape 4 alternative).

⚠️ **Bug connu du script `fail2ban-regex-local.py`** :
- Le script simule ConfigParser : `%%` dans les variables est converti en `%` (ex: `%%2eenv` → `%2eenv`)
- Les lignes `ignoreregex`/`datepattern` coupent correctement l'extraction failregex
- Si un filtre montre `0 matched` alors que les URLs semblent correctes, vérifier ces deux points

### Étape 2 : Investigation par IP (top 3-5 IPs suspectes)

```bash
# Investigation locale d'une IP suspecte
IP="<IP>"
echo "=== $IP ==="
echo "UA:" && grep "$IP" /tmp/nginx-analysis/access.log | awk -F'"' '{print $6}' | sort | uniq -c | sort -rn | head -3
echo "Status:" && grep "$IP" /tmp/nginx-analysis/access.log | awk '{print $9}' | sort | uniq -c | sort -rn | head -5
echo "URLs suspectes:" && grep "$IP" /tmp/nginx-analysis/access.log | awk '{print $7}' | grep -icE "php|env|git|config|login|admin|shell|cmd|c99|r57|wp-config|xmlrpc|\.bak|\.sql|\.log"
echo "Top URLs:" && grep "$IP" /tmp/nginx-analysis/access.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -10
```

**Alternative SSH** (si le log est trop gros pour scp) :
```bash
ssh -o BatchMode=yes -o ConnectTimeout=30 root@34.47.5.151 -p 2222 '
IP="<IP>"
grep "$IP" /var/log/nginx/access.log | head -100 > /tmp/test-ip.log
'
scp -P 2222 root@34.47.5.151:/tmp/test-ip.log /tmp/nginx-analysis/test-ip.log
```

### Étape 3 : Classification des menaces + test filtres

| Catégorie | Patterns | Filtre fail2ban |
|-----------|----------|-----------------|
| **Webshell scanner** | `wso.php`, `c99.php`, `r57.php`, `alfa.php`, `chosen.php`, `classwithtostring.php`, `cache.php` | `nginx-webscan` |
| **Secrets scanner** | `.env`, `.git/config`, `.ssh/id_rsa`, `wp-config.php`, `backup.sql`, `%2eenv`, `%2edocker/config%2ejson` | `nginx-secrets-scan` |
| **Exploit scanner** | `shell.php`, `cmd.php`, `vedcve.php`, `wp-config.php.bak` | `nginx-exploit-scan` |
| **RCE scanner** | `eval-stdin.php`, `wp_filemanager.php`, `hellopress/` | `nginx-rce-scan` |
| **Directory traversal** | `../`, `..\\` | `nginx-directory-traversal` |
| **WP brute-force** | `/wp-login.php`, `/xmlrpc.php` | `wordpress-login`, `wordpress-xmlrpc` |
| **Bad bots** | `GPTBot`, `Bytespider`, `CCBot`, `ClaudeBot`, `Mozlila` (typo UA) | `nginx-badbots` |
| **Panel scanner** | `phpmyadmin`, `adminer.php`, `wp-admin` | `nginx-panel-scan` |
| **Vite/SvelteKit exploit** | `/@fs/.env`, `/@fs/proc/self/environ`, `?raw??`, `?import&raw??` | `nginx-env-scan` |

**Patterns live** : Lire les patterns actuels directement depuis les filtres serveur :

```bash
ssh ... 'cat /etc/fail2ban/filter.d/nginx-XXX.conf'
```

### Étape 4 : Test des filtres existants

**Test local avec le script `fail2ban-regex-local.py`** (recommandé sur Windows) :

```bash
# Chemin vers le script local
SCRIPT=".github/skills/nginx-log-analyzer/fail2ban-regex-local.py"

# Tester une IP contre tous les filtres
IP="<IP>"
grep "$IP" /tmp/nginx-analysis/access.log | head -5 > /tmp/nginx-analysis/test-ip.log
for filter in /tmp/nginx-analysis/nginx-*.conf; do
  filtername=$(basename "$filter" .conf)
  result=$(python "$SCRIPT" /tmp/nginx-analysis/test-ip.log "$filter" 2>&1 | grep "Matched:" | head -1)
  echo "$filtername: $result"
done
```

**Alternative avec fail2ban-regex système** (si disponible) :

```bash
# Tester une IP contre tous les filtres
IP="<IP>"
grep "$IP" /tmp/nginx-analysis/access.log | head -5 > /tmp/nginx-analysis/test-ip.log
for filter in /tmp/nginx-analysis/nginx-*.conf; do
  filtername=$(basename "$filter" .conf)
  result=$(fail2ban-regex /tmp/nginx-analysis/test-ip.log "$filter" 2>&1 | grep "matched" | head -1)
  echo "$filtername: $result"
done
```

**Test SSH direct** (alternative) :

```bash
ssh -o BatchMode=yes -o ConnectTimeout=30 root@34.47.5.151 -p 2222 '
IP="<IP>"
grep "$IP" /var/log/nginx/access.log | head -5 > /tmp/test-ip.log
for filter in nginx-webscan nginx-secrets-scan nginx-exploit-scan nginx-rce-scan nginx-panel-scan; do
  result=$(fail2ban-regex /tmp/test-ip.log /etc/fail2ban/filter.d/$filter.conf 2>&1 | grep "matched" | head -1)
  echo "$filter: $result"
done
'
```

Si `0 matched` → analyser les URLs scannées et ajouter les patterns manquants :

```bash
# Extraction locale des URLs uniques d'une IP
grep "$IP" /tmp/nginx-analysis/access.log | awk '{print $7}' | sort -u > /tmp/nginx-analysis/urls-$IP.txt
wc -l /tmp/nginx-analysis/urls-$IP.txt
```

### Étape 5 : Mise à jour des filtres + validation faux positifs

**Workflow local** :
1. **Modifier localement** dans `/tmp/nginx-analysis/` le filtre à mettre à jour
2. **Tester localement** avant upload :
   ```bash
   fail2ban-regex /tmp/nginx-analysis/test-ip.log /tmp/nginx-analysis/nginx-XXX.conf
   ```
3. **Valider les faux positifs** (obligatoire avant upload) :
   ```bash
   # Pour chaque pattern ajouté, vérifier qu'il ne catche pas de traffic légitime
   grep -iE "PATTERN_AJOUTE" /tmp/nginx-analysis/access.log | awk '{print $1, $7, $9}' | grep -vE "IP_SUSPECTE" | head -10
   # ⚠️ Si status 200 présent → NE PAS ajouter OU ajouter dans ignoreregex
   ```

   **Validation des patterns avant ajout** :
   ```bash
   # 1. Vérifier combien de lignes le pattern ajoute
   grep -cE "NOUVEAU_PATTERN" /tmp/nginx-analysis/access.log
   # Si < 2 hits → pattern trop spécifique, risque de miss des scanners

   # 2. Vérifier qu'il ne catche pas de traffic légitime (status 200)
   grep -iE "NOUVEAU_PATTERN" /tmp/nginx-analysis/access.log | awk '{print $1, $9}' | sort -u
   # Si status 200 present → NE PAS ajouter OU ajouter dans ignoreregex

   # 3. Cas spécial admin.php : peut être un vrai fichier
   grep "admin\.php.*200" /tmp/nginx-analysis/access.log | awk '{print $1}' | sort | uniq -c
   # Si une IP légitime get 200 → ajouter à ignoreregex OU retirer du pattern
   ```
4. **Uploader** vers le serveur :
   ```bash
   scp -P 2222 /tmp/nginx-analysis/nginx-XXX.conf root@34.47.5.151:/etc/fail2ban/filter.d/
   ```
5. **Tester sur le serveur** :
   ```bash
   ssh -o BatchMode=yes -o ConnectTimeout=30 root@34.47.5.151 -p 2222 '
   fail2ban-regex /tmp/test.log /etc/fail2ban/filter.d/nginx-XXX.conf
   '
   ```
6. **Redémarrer fail2ban** :
   ```bash
   ssh -o BatchMode=yes -o ConnectTimeout=30 root@34.47.5.151 -p 2222 '
   systemctl restart fail2ban && sleep 3 && fail2ban-client status
   '
   ```

**Règle** : Si un pattern matche une IP légitime avec status 200 → ne pas ajouter OU ajouter dans `ignoreregex`.

## Bantimes recommandés

| Type de menace | Bantime | Justification |
|----------------|---------|---------------|
| **Webshell scanner** | 3600s (1h) | Scanner automatique, pas de menace directe |
| **Secrets scanner** | 3600s (1h) | Tentative de vol de config |
| **Exploit scanner** | 3600s (1h) | Scan de vulnérabilités |
| **RCE scanner** | 3600s (1h) | Tentative d'exécution de code |
| **WP brute-force** | 86400s (24h) | Attaque ciblée |
| **Bad bots** | 604800s (7j) | Bot persistant |

## Règles critiques pour les filtres fail2ban

- Le fichier est lu par Python ConfigParser
- `%` doit être échappé en `%%` SAUF dans les variables `%(variable)s`
- `datepattern` utilise `%%d/%%b/%%Y:%%H:%%M:%%S` (format nginx access log)
- `failregex` utilise `^<HOST>` pour capturer l'IP
- Le status HTTP doit inclure `301` (WordPress redirect) pour catch les scanners

## fail2ban — Commands utiles

```bash
# État des jails
fail2ban-client status

# Tester un filtre
fail2ban-regex /tmp/test.log /etc/fail2ban/filter.d/nginx-XXX.conf

# Vérifier un ban
fail2ban-client status nginx-webscan | grep <IP>

# Débannir
fail2ban-client set nginx-webscan unbanip <IP>
```

## Notes importantes

- **Ne jamais bannir les IPs du serveur** (34.47.5.151, 10.162.0.13) — les ajouter à `ignoreip`
- **Les filtres doivent inclure 301** dans les status codes (WordPress redirect)
- **Redémarrer fail2ban** après toute modification de filtre
- **Vérifier `nginx -t`** avant de redémarrer Nginx
- **Ne pas compter les Googlebot** (`66.249.x.x`) comme IPs suspectes — c'est un crawler légitime
- **`nginx-secrets-scan` ≠ `nginx-env-scan`** : secrets-scan couvre `.git/config`, `.ssh/id_rsa`, `%2eenv` (URL-encodé). Les `.env` plain sont couverts par `nginx-env-scan` (filtre séparé)

## Livrables (checklist fin de session)

- [ ] Top IPs suspectes identifiées et classifiées
- [ ] Filtres testés (fail2ban-regex SSH) — IPs catchées / non-catchées documentées
- [ ] Nouveaux patterns testés contre faux positifs (status 200 check)
- [ ] Filtres uploadés + fail2ban redémarré
- [ ] Sites toujours accessibles (curl test)
- [ ] **Rapport de couverture** : X matches / Y lignes par filtre (ex: `nginx-webscan: 145/3647`)
- [ ] **Top 5 IPs non-catchées investiguées** (legit vs scanner)
- [ ] **Nettoyage serveur** (`/tmp/test-ip.log`, `/tmp/test.log`)
- [ ] **Nettoyage local effectué** (voir ci-dessous)

## Nettoyage local (obligatoire fin de session)

Après chaque utilisation du skill, **supprimer les fichiers temporaires locaux** :

```bash
# Supprimer le dossier d'analyse local
rm -rf /tmp/nginx-analysis

# Vérifier la suppression
ls -la /tmp/ | grep nginx || echo "✅ Dossier nettoyé"
```

**Pourquoi** : Éviter l'accumulation de logs et filtres obsolètes en local. Chaque session commence avec des fichiers frais téléchargés du serveur.

## Nettoyage serveur (obligatoire fin de session)

```bash
ssh -o BatchMode=yes -o ConnectTimeout=30 root@34.47.5.151 -p 2222 '
rm -f /tmp/test-ip.log /tmp/test.log 2>/dev/null && echo "✅ Fichiers temporaires serveur supprimés"
'
```

---

## Améliorations implémentées (basées sur l'expérience)

### ✅ 1. Workflow de téléchargement local
- Télécharger → analyser localement → réuploader si modifications
- Meilleure lisibilité, pas de troncation SSH

### ✅ 2. Patterns `nginx-webscan` enrichis
- **Ajouté** : `cache\.php` (scanner récursif courant)
- **Ajouté** : `eval-stdin\.php`, `wp_filemanager\.php` (RCE)

### ✅ 3. Pattern `Mozlila` dans `nginx-badbots-custom`
- UA `Mozlila/5.0` = typo volontaire de scanner Android
- Ajouté au filtre pour blocage automatique

### ✅ 4. Filtre `nginx-secrets-scan` enrichi (session précédente)
- Patterns ajoutés : `config.json`, `config.yaml`, `settings.py`, `%2eenv`, `%2edocker`
- Couverture passée de ~40% à ~80%

### ✅ 5. Nettoyage serveur ajouté au workflow
- Étape de nettoyage obligatoire en fin de session

### ✅ 6. Détection `fail2ban-regex` local
- **Problème** : `fail2ban-regex` absent sur Windows
- **Solution** : Script `fail2ban-regex-local.py` inclus dans le skill
- **Utilisation** : `python .github/skills/nginx-log-analyzer/fail2ban-regex-local.py <log> <filter>`

### ✅ 7. Filtres serveur ground truth documentée
- `nginx-webscan` : `cache\.php`, `eval-stdin\.php`, `wp_filemanager\.php`
- `nginx-badbots-custom` : `Mozlila` (typo UA)
- `nginx-secrets-scan` : `config.json`, `config.yaml`, `settings.py`, `%2eenv`, `%2edocker`

### ✅ 8. Patterns `nginx-webscan` enrichis (session 2026-08-05)
- **Ajouté** : `xwpg`, `wyzer1`, `ws83`, `ww5`, `zup.php73`, `wp-Blogs`, `wp-blink`, `gecko-new`, `sagax1`, `atex1`, `fone1`, `ncx`, `err`, `img`, `clarebypas`, `alfa`, `admin`
- **Ajouté** : `222` dans `short_php` (noms numériques)
- **Résultat** : couverture passée de 97 à 145 matches (+49%)

### ✅ 9. Bugs `fail2ban-regex-local.py` corrigés (session 2026-08-05)
- **Bug 1** : `%%` non converti en `%` → patterns URL-encodés ne matchaient pas
- **Bug 2** : `ignoreregex`/`datepattern` pas reconnus comme fin de section failregex
- **Résultat** : `nginx-exploit-scan` (0→26), `nginx-panel-scan` (0→7), `nginx-wordpress-login` (0→6)

### ✅ 10. Clarification `nginx-secrets-scan` vs `nginx-env-scan`
- `nginx-secrets-scan` : `.git/config`, `.ssh/id_rsa`, `%2eenv` (URL-encodé)
- `nginx-env-scan` : `.env` plain, `.env.local`, `.env.backup`, `/@fs/.env`
- **Ne pas confondre** les deux filtres

## Améliorations restantes

### 11. Rapport de session automatisé
- Générer `reports/nginx-analysis-YYYY-MM-DD.md` pour historique

### 12. Script de test automatisé post-upload
- Vérifier faux positifs + ban IP + curl test en une commande

### 13. Monitoring en temps réel
- `tail -f` avec filtrage pour visibilité attaques en cours

### 14. Filtre `nginx-secrets-scan` — patterns restants
- `azure-credentials*`, `terraform%2etfstate`, `.pem` variants
- Priorité moyenne — scanner déjà bloqué

### 15. Analyse IA des patterns manquants
- Script qui compare les URLs 404/401 non-catchées et suggère des patterns à ajouter
- Réduire le temps d'analyse manuelle