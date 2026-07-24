#!/bin/bash
# ============================================================
# WP-CLI Server - Update tous les sites WordPress
# Usage: bash wp_update_all.sh [optional_site_filter]
# ============================================================

SITES=(
  /home/buffetlise/public_html
  /home/terrainsmauricie/public_html
  /home/projetlrgmedia/public_html
  /home/projetlrgmedia/absolu.projet.lrgmedia.ca
  /home/lrgmedia/public_html
  /home/renoverexpert/designer.expert
  /home/lecoinapat/public_html
  /home/csaentreprise/public_html
  /home/droletsimard/public_html
  /home/droletsimard/boisdroletsimard.com
  /home/droletsimard/staging.droletsimard.com
  /home/jolygateries/public_html
  /home/pnp/public_html
  /home/pnp/old.productionsnoeudpapillon.com
  /home/cotelafo/public_html
  /home/mclim/public_html
  /home/admindatainc/public_html
  /home/sciagedebetonai/public_html
  /home/campinglacmagog/public_html
  /home/firmebrouillette/public_html
  /home/bonpasteursher/public_html
  /home/minilab/public_html
  /home/taillagedehaies/public_html
  /home/absoluresidence/public_html
  /home/ficelle/public_html
  /home/comuse/public_html
)

TOTAL=${#SITES[@]}
COUNT=0
NOW=$(date +%Y%m%d_%H%M%S)
LOG="/tmp/wp_update_${NOW}.log"

echo "=== DEBUT UPDATE WP - $(date) | Sites: $TOTAL ===" | tee "$LOG"

for DIR in "${SITES[@]}"; do
  COUNT=$((COUNT + 1))
  SITE=$(basename "$(dirname "$DIR")")
  
  # Skip si le dossier n'existe pas
  if [ ! -d "$DIR" ]; then
    echo "[$COUNT/$TOTAL] $SITE - SKIP (dossier inexistant)" | tee -a "$LOG"
    continue
  fi
  
  cd "$DIR" 2>/dev/null || {
    echo "[$COUNT/$TOTAL] $SITE - SKIP (acces refuse)" | tee -a "$LOG"
    continue
  }

  echo "[$COUNT/$TOTAL] $SITE ($DIR)" | tee -a "$LOG"
  echo "  Site URL: $(wp option get siteurl --allow-root --no-color 2>/dev/null | tail -1)" | tee -a "$LOG"

  # Core update
  WP_CORE=$(wp core update --allow-root --no-color 2>&1 | tail -1)
  echo "  Core: $WP_CORE" | tee -a "$LOG"

  # DB update
  WP_DB=$(wp core update-db --allow-root --no-color 2>&1 | tail -1)
  echo "  DB: $WP_DB" | tee -a "$LOG"

  # Plugin update
  PLUGINS=$(wp plugin update --all --allow-root --no-color 2>&1 | grep -E "^(Success|Error)" | head -1)
  echo "  Plugins: $PLUGINS" | tee -a "$LOG"

  # Theme update
  THEMES=$(wp theme update --all --allow-root --no-color 2>&1 | grep -E "^(Success|Error)" | head -1)
  echo "  Themes: $THEMES" | tee -a "$LOG"

  # Cache flush
  wp cache flush --allow-root --no-color 2>&1 > /dev/null
  wp transient delete --all --allow-root --no-color 2>&1 > /dev/null
  echo "  Cache: flushed" | tee -a "$LOG"

  # Version finale
  FINAL_VERSION=$(wp core version --allow-root --no-color 2>&1 | tail -1)
  echo "  Version finale: $FINAL_VERSION" | tee -a "$LOG"
  echo "" | tee -a "$LOG"
done

echo "=== FIN UPDATE WP - $(date) ===" | tee -a "$LOG"
echo "Sites traites: $COUNT | Log: $LOG" | tee -a "$LOG"
