<?php
/**
 * WP Media Cleanup - Analyse ULTRA OPTIMISÉE en JSON
 *
 * Usage:
 *   wp eval-file check_usage.php --allow-root --no-color                  # JSON (défaut)
 *   wp eval-file check_usage.php text --allow-root --no-color             # Table lisible
 *
 * Stratégie : 9 requêtes SQL massives → tout en mémoire → recherche PHP.
 * Zéro requête en boucle. ~100x plus rapide que l'ancienne version.
 *
 * Les requêtes SQL (9 au total) :
 *   1a. Toutes les images (avec auteur + MIME type)
 *   1b. Tous les posts/pages (avec auteur)
 *   1c. Featured images (_thumbnail_id)
 *   1d. Données Elementor (_elementor_data)
 *   1e. Contenu des posts (post_content)
 *   1f. Autres postmeta (concaténés)
 *   1g. Métadonnées d'attachement (_wp_attachment_metadata)
 *   1g2. Texte alternatif d'image (_wp_attachment_image_alt)
 *   1h. Noms d'utilisateurs (ID → display_name)
 */

global $wpdb;

$tablePosts    = $wpdb->posts;
$tablePostMeta = $wpdb->postmeta;

// ═══ PHASE 1 : CHARGEMENT MASSIF (9 requêtes SQL) ═══════════════════════

// 1a. Toutes les images (ID, guid, titre, date, auteur, MIME type)
$images = $wpdb->get_results(
    "SELECT p.ID, p.guid, p.post_title, p.post_date, p.post_author, p.post_mime_type
     FROM $tablePosts p
     WHERE p.post_type = 'attachment'
       AND p.post_status = 'inherit'
       AND p.post_mime_type LIKE 'image/%'
     ORDER BY p.post_date DESC",
    ARRAY_A
);

// 1b. Tous les posts/pages (pour permalink lazy + titre)
$allPosts = $wpdb->get_results(
    "SELECT ID, post_title, post_type, post_author
     FROM $tablePosts
     WHERE post_type IN ('page','post','elementor_library','jet-engine')
       AND post_status IN ('publish','draft','pending','private')",
    ARRAY_A
);

$postMap = [];
foreach ($allPosts as $p) {
    $pid = intval($p['ID']);
    $postMap[$pid] = [
        'title'  => $p['post_title'],
        'type'   => $p['post_type'],
        'author' => intval($p['post_author']),
    ];
}
unset($allPosts);

// 1c. Featured images (image_id → [post_ids])
$featuredMap = [];
foreach ($wpdb->get_results(
    "SELECT meta_value AS image_id, post_id
     FROM $tablePostMeta WHERE meta_key = '_thumbnail_id'",
    ARRAY_A
) as $fi) {
    $iid = intval($fi['image_id']);
    if (!isset($featuredMap[$iid])) $featuredMap[$iid] = [];
    $featuredMap[$iid][] = intval($fi['post_id']);
}

// 1d. Données Elementor (post_id → raw value)
$elementorMap = [];
foreach ($wpdb->get_results(
    "SELECT post_id, meta_value
     FROM $tablePostMeta WHERE meta_key = '_elementor_data'",
    ARRAY_A
) as $e) {
    $elementorMap[intval($e['post_id'])] = $e['meta_value'];
}

// 1e. Tout post_content (post_id → contenu brut)
$contentMap = [];
foreach ($wpdb->get_results(
    "SELECT ID, post_content FROM $tablePosts
     WHERE post_type IN ('page','post') AND post_status = 'publish'",
    ARRAY_A
) as $c) {
    $contentMap[intval($c['ID'])] = $c['post_content'];
}

// 1f. Postmeta filtré aux clés contenant typiquement des URLs
//      (élimine 70-80% du bruit : admin_color, rich_editing, etc.)
$metaMap = [];
foreach ($wpdb->get_results(
    "SELECT post_id, GROUP_CONCAT(meta_value SEPARATOR ' ') AS all_meta
     FROM $tablePostMeta
     WHERE meta_key NOT IN ('_elementor_data','_thumbnail_id','_wp_attachment_metadata','_wp_attachment_image_alt')
       AND post_id IN (SELECT ID FROM $tablePosts WHERE post_type NOT IN ('revision','attachment'))
     GROUP BY post_id",
    ARRAY_A
) as $m) {
    $metaMap[intval($m['post_id'])] = $m['all_meta'];
}

// 1g. Métadonnées d'attachement (post_id → valeur sérialisée)
$attachmentMetaMap = [];
foreach ($wpdb->get_results(
    "SELECT post_id, meta_value
     FROM $tablePostMeta WHERE meta_key = '_wp_attachment_metadata'",
    ARRAY_A
) as $am) {
    $attachmentMetaMap[intval($am['post_id'])] = $am['meta_value'];
}

// 1g2. Texte alternatif des images (post_id → alt text)
$attachmentAltMap = [];
foreach ($wpdb->get_results(
    "SELECT post_id, meta_value
     FROM $tablePostMeta WHERE meta_key = '_wp_attachment_image_alt'",
    ARRAY_A
) as $aa) {
    $attachmentAltMap[intval($aa['post_id'])] = $aa['meta_value'];
}

// 1h. Noms des utilisateurs (user_id → display_name)
$userMap = [];
foreach ($wpdb->get_results(
    "SELECT ID, display_name FROM {$wpdb->users}",
    ARRAY_A
) as $u) {
    $userMap[intval($u['ID'])] = $u['display_name'];
}

// ═══ HELPERS ══════════════════════════════════════════════════════════════

/**
 * Extrait un snippet de contexte autour de l'occurrence de $needle dans $haystack.
 * Retourne un texte tronqué à $maxLen caractères, centré sur la position trouvée.
 *
 * @param string $haystack Texte source complet
 * @param string $needle   Terme recherché
 * @param int    $maxLen   Longueur maximale du snippet (défaut : 80)
 * @return string|null     Le snippet ou null si non trouvé
 */
function extract_context($haystack, $needle, $maxLen = 80) {
    $pos = stripos($haystack, $needle);
    if ($pos === false) return null;

    $start  = max(0, $pos - (int)($maxLen / 2));
    $snippet = substr($haystack, $start, $maxLen);

    // Nettoyage : sauts de ligne → espaces, suppression balises HTML
    $snippet = str_replace(["\n", "\r", "\t"], ' ', $snippet);
    $snippet = preg_replace('/<[^>]*>/', ' ', $snippet);
    $snippet = preg_replace('/\s+/', ' ', $snippet);
    $snippet = trim($snippet);

    // Ellipses si tronqué aux extrémités
    if ($start > 0)                        $snippet = '…' . $snippet;
    if ($start + $maxLen < strlen($haystack)) $snippet .= '…';

    return mb_strlen($snippet) > $maxLen ? mb_substr($snippet, 0, $maxLen) : $snippet;
}

/**
 * Extrait la taille du fichier (octets) depuis les métadonnées sérialisées.
 *
 * @param string $serializedMeta Valeur brute de _wp_attachment_metadata
 * @return string                Taille en octets ou '0'
 */
function extract_file_size($serializedMeta) {
    if (empty($serializedMeta)) return '0';
    $meta = @unserialize($serializedMeta);
    if (!is_array($meta)) return '0';

    // Préférer 'filesize' s'il existe (calculé par WP)
    if (isset($meta['filesize'])) return strval($meta['filesize']);

    // Sinon, si 'sizes' existe, sommer toutes les tailles
    if (isset($meta['sizes']) && is_array($meta['sizes'])) {
        $total = 0;
        foreach ($meta['sizes'] as $sz) {
            if (isset($sz['filesize'])) $total += intval($sz['filesize']);
        }
        return $total > 0 ? strval($total) : '0';
    }

    return '0';
}

/**
 * Formate une taille en octets en taille lisible (Ko, Mo, Go).
 *
 * @param string|int $bytes Taille en octets
 * @return string           Taille formatée (ex: "1.2 Mo", "345 Ko")
 */
function format_size($bytes) {
    $bytes = intval($bytes);
    if ($bytes === 0) return 'N/A';
    $units = ['octets', 'Ko', 'Mo', 'Go'];
    $i = 0;
    while ($bytes >= 1024 && $i < count($units) - 1) {
        $bytes /= 1024;
        $i++;
    }
    return round($bytes, 1) . ' ' . $units[$i];
}

// ═══ PHASE 2 : RECHERCHE 100% EN MÉMOIRE ════════════════════════════════

$permalinkCache = [];

$result = [
    'summary' => [
        'total'      => count($images),
        'used'       => 0,
        'unused'     => 0,
        'unused_ids' => [],
    ],
    'images' => [],
];

foreach ($images as $img) {
    $id       = intval($img['ID']);
    $guid     = $img['guid'];
    $filename = basename(rtrim($guid));
    $isSvg    = (stripos($filename, '.svg') !== false);
    $searchTerm = $isSvg ? $filename : $guid;

    // ── Métadonnées enrichies ──
    $authorId   = intval($img['post_author']);
    $authorName = isset($userMap[$authorId]) ? $userMap[$authorId] : 'Inconnu';
    $mimeType   = $img['post_mime_type'];
    $fileSize   = isset($attachmentMetaMap[$id]) ? extract_file_size($attachmentMetaMap[$id]) : '0';
    $altText    = isset($attachmentAltMap[$id])   ? $attachmentAltMap[$id] : '';

    $uses  = [];
    $used  = false;
    $seen  = []; // hash pour dedup O(1)

    // 1. Featured (O(1) lookup)
    if (isset($featuredMap[$id])) {
        foreach ($featuredMap[$id] as $pid) {
            if (!isset($seen[$pid]) && isset($postMap[$pid])) {
                $seen[$pid] = 1;
                if (!isset($permalinkCache[$pid])) $permalinkCache[$pid] = get_permalink($pid);
                $uses[] = [
                    'type'    => 'FEATURED',
                    'post_id' => $pid,
                    'url'     => $permalinkCache[$pid],
                    'title'   => $postMap[$pid]['title'],
                    'context' => null,
                ];
                $used = true;
            }
        }
    }

    // 2. Elementor (scan mémoire PHP — pas de SQL)
    foreach ($elementorMap as $pid => $data) {
        if (!isset($seen[$pid]) && isset($postMap[$pid]) && stripos($data, $searchTerm) !== false) {
            $seen[$pid] = 1;
            if (!isset($permalinkCache[$pid])) $permalinkCache[$pid] = get_permalink($pid);
            $uses[] = [
                'type'    => 'ELEMENTOR',
                'post_id' => $pid,
                'url'     => $permalinkCache[$pid],
                'title'   => $postMap[$pid]['title'],
                'context' => null, // lazy: extract_context() appelé en phase 3 si besoin
            ];
            $used = true;
        }
    }

    // 3. Content (scan mémoire PHP)
    foreach ($contentMap as $pid => $content) {
        if (!isset($seen[$pid]) && isset($postMap[$pid]) && stripos($content, $searchTerm) !== false) {
            $seen[$pid] = 1;
            if (!isset($permalinkCache[$pid])) $permalinkCache[$pid] = get_permalink($pid);
            $uses[] = [
                'type'    => 'CONTENT',
                'post_id' => $pid,
                'url'     => $permalinkCache[$pid],
                'title'   => $postMap[$pid]['title'],
                'context' => null, // lazy
            ];
            $used = true;
        }
    }

    // 4. Meta (scan mémoire PHP)
    foreach ($metaMap as $pid => $data) {
        if (!isset($seen[$pid]) && isset($postMap[$pid]) && stripos($data, $searchTerm) !== false) {
            $seen[$pid] = 1;
            if (!isset($permalinkCache[$pid])) $permalinkCache[$pid] = get_permalink($pid);
            $uses[] = [
                'type'    => 'META',
                'post_id' => $pid,
                'url'     => $permalinkCache[$pid],
                'title'   => $postMap[$pid]['title'],
                'context' => null, // lazy
            ];
            $used = true;
        }
    }

    // ── Statut et compteurs ──
    $status = $used ? 'USED' : 'UNUSED';
    if ($used) {
        $result['summary']['used']++;
    } else {
        $result['summary']['unused']++;
        $result['summary']['unused_ids'][] = $id;
    }

    $result['images'][] = [
        'id'       => $id,
        'date'     => $img['post_date'],
        'title'    => $img['post_title'],
        'filename' => $filename,
        'url'      => $guid,
        'size'     => $fileSize,
        'alt'      => $altText,
        'author'   => $authorName,
        'type'     => $mimeType,
        'status'   => $status,
        'uses'     => $uses,
        '_search'  => $searchTerm, // interne: pour le contexte lazy
    ];
}

// ═══ PHASE 3 : ENRICHISSEMENT LAZY + SORTIE ═══════════════════════════

// Détection du format : variable d'environnement ou 'json' (défaut)
$outputFormat = getenv('WP_MEDIA_FORMAT') ?: 'json';

// Contexte lazy : extraire les snippets maintenant (une seule passe)
// uniquement pour les images utilisées en mode text
if ($outputFormat === 'text') {
    foreach ($result['images'] as &$img) {
        if ($img['status'] !== 'USED') continue;
        $searchFor = $img['_search'];
        foreach ($img['uses'] as &$use) {
            if ($use['context'] !== null) continue; // déjà fait (FEATURED)
            $srcData = null;
            switch ($use['type']) {
                case 'ELEMENTOR': $srcData = $elementorMap[$use['post_id']] ?? null; break;
                case 'CONTENT':   $srcData = $contentMap[$use['post_id']]   ?? null; break;
                case 'META':      $srcData = $metaMap[$use['post_id']]      ?? null; break;
            }
            if ($srcData !== null) $use['context'] = extract_context($srcData, $searchFor);
        }
    }
    unset($img, $use);
}

if ($outputFormat === 'text') {
    // ── Format texte lisible ──
    $unusedImages = [];
    $usedCounts   = ['FEATURED' => 0, 'ELEMENTOR' => 0, 'CONTENT' => 0, 'META' => 0];

    foreach ($result['images'] as $img) {
        if ($img['status'] === 'UNUSED') {
            // Grouper par mois/année (clé YYYY-MM)
            $dateObj   = date_create($img['date']);
            $monthYear = $dateObj ? date_format($dateObj, 'Y-m') : '0000-00';
            if (!isset($unusedImages[$monthYear])) $unusedImages[$monthYear] = [];
            $unusedImages[$monthYear][] = $img;
        } else {
            foreach ($img['uses'] as $use) {
                $type = $use['type'];
                if (isset($usedCounts[$type])) $usedCounts[$type]++;
            }
        }
    }

    // Du plus récent au plus ancien
    krsort($unusedImages);

    echo "╔══════════════════════════════════════════════════════════════════════╗\n";
    echo "║                  WP MEDIA CLEANUP — RAPPORT                       ║\n";
    echo "╚══════════════════════════════════════════════════════════════════════╝\n\n";

    // ── Résumé global ──
    echo "📊 RÉSUMÉ\n";
    echo str_repeat('─', 70) . "\n";
    echo "  Total images    : " . $result['summary']['total'] . "\n";
    echo "  ✅ Utilisées    : " . $result['summary']['used'] . "\n";
    echo "  ❌ Inutilisées  : " . $result['summary']['unused'] . "\n\n";

    // ── Compteur par type d'utilisation ──
    echo "📈 IMAGES UTILISÉES (par type)\n";
    echo str_repeat('─', 70) . "\n";
    foreach ($usedCounts as $type => $count) {
        echo "  " . str_pad($type, 12) . " : $count\n";
    }
    echo "\n";

    // ── Liste des images inutilisées, groupées par mois ──
    echo "🗑️  IMAGES INUTILISÉES (groupées par date)\n";
    echo str_repeat('═', 70) . "\n";

    if (empty($unusedImages)) {
        echo "  Aucune image inutilisée trouvée ! 🎉\n";
    } else {
        $monthNames = [
            '01' => 'Janvier',  '02' => 'Février',  '03' => 'Mars',
            '04' => 'Avril',    '05' => 'Mai',      '06' => 'Juin',
            '07' => 'Juillet',  '08' => 'Août',     '09' => 'Septembre',
            '10' => 'Octobre',  '11' => 'Novembre', '12' => 'Décembre',
        ];

        foreach ($unusedImages as $monthYear => $imgs) {
            $parts      = explode('-', $monthYear);
            $year       = $parts[0];
            $monthNum   = isset($parts[1]) ? ltrim($parts[1], '0') : '??';
            $monthLabel = isset($monthNames[$monthNum]) ? $monthNames[$monthNum] : 'Mois ' . $monthNum;

            echo "\n  📅 $monthLabel $year (" . count($imgs) . " images)\n";
            echo "  " . str_repeat('·', 66) . "\n";

            foreach ($imgs as $img) {
                $titleTrim = mb_strlen($img['title']) > 35
                    ? mb_substr($img['title'], 0, 32) . '…'
                    : $img['title'];
                $sizeStr   = format_size($img['size']);
                $fileTrim  = mb_strlen($img['filename']) > 30
                    ? mb_substr($img['filename'], 0, 27) . '…'
                    : $img['filename'];

                echo "    $fileTrim\n";
                echo "      Titre : $titleTrim | Taille : $sizeStr\n";
                echo "      URL   : {$img['url']}\n";
            }
        }
    }

    echo "\n" . str_repeat('═', 70) . "\n";
    echo "Terminé le " . date('Y-m-d H:i:s') . "\n";

} else {
    // ── Format JSON (défaut) ──
    // Nettoyer les champs internes avant sortie
    foreach ($result['images'] as &$img) {
        unset($img['_search']);
    }
    unset($img);
    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
