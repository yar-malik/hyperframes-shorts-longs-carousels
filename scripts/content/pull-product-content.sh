#!/usr/bin/env bash
# Copies the CCM / AVC / Voho content skills, and everything those skills refer to, from the yarmalik.com repo
# into this one. yarmalik.com stays the source of truth; this is a one-way copy you can re-run any time.
#
#   scripts/content/pull-product-content.sh                      # source defaults to ../yarmalik.com
#   YARMALIK_DIR=/path/to/yarmalik.com scripts/content/pull-product-content.sh
#
# Everything lands in product-content/ (its own private repo, yar-malik/yarmalik-product-content), laid out
# exactly as in yarmalik.com, so a path in a skill like `scripts/voho/produce.mjs` means
# `product-content/scripts/voho/produce.mjs`. The skills go to product-content/.claude/skills/ and are linked
# into this repo's .claude/skills/. Commit and push inside product-content/ afterwards.
set -euo pipefail

HERE="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="${YARMALIK_DIR:-$HERE/../yarmalik.com}"
DST="$HERE/product-content"
[ -f "$SRC/.claude/skills/ccm-content/SKILL.md" ] || { echo "yarmalik.com not found at $SRC (set YARMALIK_DIR)"; exit 1; }

EXCLUDES=(--exclude node_modules --exclude .DS_Store --exclude '.env' --exclude '.env.*' --exclude .git
          --exclude .hyperframes --exclude .thumbnails --exclude snapshots)

# The three skills.
mkdir -p "$DST/.claude/skills"
for p in ccm avc voho; do rsync -a --delete "${EXCLUDES[@]}" "$SRC/.claude/skills/$p-content" "$DST/.claude/skills/"; done

# Everything the skills reference, same relative paths as in yarmalik.com.
PATHS=(
  package.json package-lock.json
  scripts/content scripts/long scripts/voho scripts/avatar scripts/board scripts/thumbnail
  content/avatar content/references content/skool content/topics content/voho content/vault
  docs/specs docs/playbook
  open-source/animation-base
  public/content-automation
  videos/_voho-shared
  videos/freellm-free-claude
  videos/avc-ai-clone-reel videos/avc-dollar-video
  videos/ccm-spreadsheet-dashboard-reel videos/ccm-spreadsheet-tool videos/ccm-turn-a-spreadsheet-into-a-dashboard
  videos/voho-12-where-is-my-order-answered-without videos/voho-order-status-reel videos/voho-property-hum
  videos/voho-saudi-clinic videos/voho-tutorial-build-an-ai-phone-agent
)
for p in "${PATHS[@]}"; do
  [ -e "$SRC/$p" ] || { echo "skip (missing in source): $p"; continue; }
  mkdir -p "$DST/$(dirname "$p")"
  rsync -a --delete "${EXCLUDES[@]}" "$SRC/$p" "$DST/$(dirname "$p")/"
done

"$HERE/scripts/content/link-product-skills.sh"
(cd "$DST" && node scripts/content/sync-skills.mjs >/dev/null) && echo "skills in sync"
echo "done: $(du -sh "$DST" | cut -f1) in product-content/"
