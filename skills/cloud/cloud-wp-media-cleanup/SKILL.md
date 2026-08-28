---
name: cloud-wp-media-cleanup
description: 'Nettoyage de la médiathèque WordPress: trouver et supprimer les médias inutilisés. Script PHP ultra-optimisé (9 requêtes SQL, tout en mémoire, ~1.5s). Format texte lisible ou JSON.'
argument-hint: 'Site WordPress cible (ex: absoluresidence, lrgmedia) ou action (scan, cleanup, check-single).'
user-invocable: true
---

# WP Media Cleanup

## Objectif

Analyser et nettoyer la médiathèque WordPress en identifiant les médias réellement inutilisés, puis les supprimer en toute sécurité.

## Prérequis

- Accès SSH au serveur WordPress cible
- WP-CLI installé
- Script PHP `check_usage.php` (seul fichier nécessaire)

## Fichiers

| Fichier | Rôle |
|---------|------|
| `check_usage.php` | Script d'analyse ultra-optimisé (9 requêtes SQL, mémoire PHP) |
| `SKILL.md` | Cette documentation |

## Règles de Sécurité

1. **TOUJOURS** faire un backup avant toute opération : `wp db export /tmp/backup.sql`
2. Supprimer les révisions avant le scan pour éviter les faux positifs
3. Vider le cache et les transients pour avoir des résultats à jour
4. **JAMAIS** supprimer sans vérifier l'utilisation exacte
5. Pour les images non-SVG : chercher par **URL complète** du média (évite les faux positifs)
6. Pour les SVG : chercher par **nom de fichier** (Elementor peut stocker des URLs différentes)
7. Vérifier les 4 sources : Featured images, Elementor data, post content, autres postmeta
8. Après suppression : nettoyer postmeta orpheline + flush cache

## Script : check_usage.php

### Performance

**~1.5 seconde** pour 474 images — 9 requêtes SQL massives, tout en mémoire PHP, zéro requête en boucle.

### Usage

```bash
# Format texte lisible (recommandé)
WP_MEDIA_FORMAT=text wp eval-file check_usage.php --allow-root --no-color

# Format JSON (pour traitement automatique)
wp eval-file check_usage.php --allow-root --no-color
```

### Données fournies par image

| Champ | Description |
|-------|-------------|
| `id` | ID WordPress de l'attachement |
| `date` | Date d'upload |
| `title` | Titre du média |
| `filename` | Nom du fichier |
| `url` | URL complète (GUID) |
| `size` | Taille en octets |
| `alt` | Texte alternatif |
| `author` | Nom de l'auteur |
| `type` | MIME type (image/jpeg, image/svg+xml...) |
| `status` | USED ou UNUSED |
| `uses[]` | Liste des utilisations avec type, URL, titre, contexte |

### Types d'utilisation détectés

| Type | Source | Méthode |
|------|--------|---------|
| **FEATURED** | `_thumbnail_id` | Lookup direct par ID |
| **ELEMENTOR** | `_elementor_data` | Recherche en mémoire |
| **CONTENT** | `post_content` | Recherche en mémoire |
| **META** | Autres postmeta | Recherche en mémoire |

### Différence SVG vs autres images

| Type | Méthode de recherche | Raison |
|------|---------------------|--------|
| **SVG** | `stripos($filename)` | Elementor peut stocker des URLs avec des chemins différents |
| **Autres** | `stripos($guid)` | Éviter les faux positifs (ex: `Absolu-residence.jpg` dans `lmf-absolu-residence.jpg`) |

## Workflow : Scan complet

```bash
# 1. Backup
wp db export /tmp/backup_$(date +%Y%m%d).sql

# 2. Nettoyer les révisions
wp post delete $(wp post list --post_type=revision --format=ids) --force

# 3. Vider cache
wp cache flush && wp transient delete --all

# 4. Lancer le scan (format texte)
WP_MEDIA_FORMAT=text wp eval-file check_usage.php --allow-root --no-color

# 5. Résultat JSON pour traitement auto
wp eval-file check_usage.php --allow-root --no-color | jq '.summary.unused_ids'

# 6. Supprimer les UNUSED
wp post delete <ids> --force
wp cache flush
```

## Workflow : Nettoyage par titre

```bash
# Lister les médias
wp post list --post_type=attachment --s='Titre' --fields=ID,guid

# Vérifier usage de chaque ID
wp post meta get <ID> _thumbnail_id 2>/dev/null && echo 'FEATURED'
wp db query "SELECT post_id FROM wp_postmeta WHERE meta_key='_elementor_data' AND meta_value LIKE '%URL%'" --skip-column-names

# Supprimer si inutilisé
wp post delete <ID> --force
```

## Workflow : Migration featured images

```bash
# Trouver les pages avec une featured image du groupe
wp db query "SELECT post_id FROM wp_postmeta WHERE meta_key='_thumbnail_id' AND meta_value IN (<ids>)"

# Remplacer par le média cible
wp db query "UPDATE wp_postmeta SET meta_value=<target_id> WHERE meta_key='_thumbnail_id' AND meta_value IN (<old_ids>)"

# Supprimer les anciens médias
wp post delete <old_ids> --force
```

## Erreurs Courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| Faux positif avec `LIKE '%filename%'` | Le filename est commun à plusieurs URLs | Utiliser l'URL complète du média |
| SVG non détecté comme utilisé | Elementor stocke des URLs avec des chemins différents | Pour les SVG, chercher par filename |
| Image supprimée alors qu'utilisée | Recherche trop large ou trop étroite | Toujours vérifier Featured + Elementor + Content |
| Postmeta orpheline après suppression | Les métadonnées ne sont pas supprimées automatiquement | `DELETE FROM postmeta WHERE post_id NOT IN (SELECT ID FROM posts)` |

## Détection du préfixe de table

Le script détecte automatiquement le préfixe de la base de données via `$wpdb->prefix`. Aucune configuration manuelle nécessaire.

## Utilisation

```bash
wp eval-file check_usage.php --allow-root --no-color
```

## Adaptation multisite

Le script fonctionne sur n'importe quel site WordPress. Il suffit de :
1. Se connecter au bon serveur via SSH
2. Naviguer vers le répertoire du site WordPress
3. Exécuter le script avec `wp eval-file`
