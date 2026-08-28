---
name: cloud-dns-server
description: 'Gestion DNS du cloud server via PowerDNS. Query DNS public, generer/mettre a jour les zones, ajouter/supprimer des domaines, verifier l etat des zones.'
argument-hint: 'Domaine a gerer ou action (query, add, update, check, list).'
user-invocable: true
---

# DNS Cloud Server

## Objectif

Gerer les DNS du serveur cloud via **PowerDNS** (backend bind). Ce skill couvre :
- L extraction des DNS records publics d un domaine
- La generation de fichiers zone Bind
- L upload et le rechargement des zones sur le serveur
- La verification de l etat des zones
- Le listing de toutes les zones actives

## Source De Verite

### Infrastructure DNS

| Composant | Valeur |
|-----------|--------|
| **Serveur DNS** | PowerDNS (launch=bind) |
| **Backend** | Bind (fichiers zone dans /var/named/) |
| **Zones** | `/var/named/*.db` |
| **Reload** | `pdns_control reload` |
| **Vanity NS** | `ns1.cloud.lrgmedia.ca` / `ns2.cloud.lrgmedia.ca` |
| **IP NS** | `34.47.5.151` |
| **IP Serveur** | `34.47.5.151` |
| **SSH Port** | `2222` |
| **SSH User** | `root` |
| **SSH Host** | `34.47.5.151` |

### Workflow : Ajouter un Domaine

1. **Extraire les DNS publics** du domaine actuel :
   ```bash
   node .github/skills/dns-cloud-server/scripts/dig-dns.js domaine.com
   ```

2. **Generer le fichier zone** Bind :
   ```bash
   node .github/skills/dns-cloud-server/scripts/generate-zone.js domaine.com
   ```
   → Cree `zones/domaine.com.db`

3. **Uploader la zone** sur le serveur + rechargement PowerDNS :
   ```bash
   node .github/skills/dns-cloud-server/scripts/sync-zone-to-server.js zones/domaine.com.db
   ```

4. **Changer le NS** chez le registrar vers :
   - `ns1.cloud.lrgmedia.ca`
   - `ns2.cloud.lrgmedia.ca`

5. **Verifier** que la zone fonctionne :
   ```bash
   node .github/skills/dns-cloud-server/scripts/check-zone-status.js domaine.com
   ```

### Workflow : Modifier un Record

1. **SSH** vers le serveur
2. **Editer** le fichier zone : `/var/named/domaine.com.db`
3. **Recharger** PowerDNS :
   ```bash
   pdns_control reload
   ```
4. **Verifier** avec `dig` ou `check-zone-status.js`

### Workflow : Verifier l Etat

```bash
# Verifier une zone specifique
node .github/skills/dns-cloud-server/scripts/check-zone-status.js domaine.com

# Lister toutes les zones PowerDNS
node .github/skills/dns-cloud-server/scripts/list-all-zones.js
```

### Workflow : Supprimer un Domaine

1. **Changer le NS** chez le registrar (revenir aux NS du registrar)
2. **Supprimer la zone** sur le serveur :
   ```bash
   ssh -p 2222 root@34.47.5.151 "rm /var/named/domaine.com.db && pdns_control reload"
   ```

## Commandes SSH Utiles

| Commande | Description |
|----------|-------------|
| `pdns_control reload` | Recharger toutes les zones PowerDNS |
| `pdns_control list-zones` | Lister toutes les zones activees |
| `pdns_control status` | Statut de PowerDNS |
| `cat /var/named/domaine.com.db` | Voir le contenu d une zone |
| `ls /var/named/*.db` | Lister tous les fichiers zone |

## Scripts Inclus

| Script | Usage |
|--------|-------|
| `scripts/dig-dns.js` | Query DNS public d un domaine |
| `scripts/generate-zone.js` | Generer fichier zone Bind depuis DNS public |
| `scripts/sync-zone-to-server.js` | Upload zone + reload PowerDNS |
| `scripts/check-zone-status.js` | Verifier etat d une zone sur serveur |
| `scripts/list-all-zones.js` | Lister toutes les zones PowerDNS |

## Regles

- **Ne jamais** modifier une zone sans verification prealable avec `dig-dns.js`
- **Toujours** recharger PowerDNS apres modification (`pdns_control reload`)
- **Verifier** que le NS est change chez le registrar avant de declarer un domaine actif
- **Sauvegarder** une copie du fichier zone avant modification
- **Logger** toute action DNS effectuee
