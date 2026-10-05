#!/usr/bin/env bash
# Copies the CCM / AVC / Voho content skills, and everything those skills refer to, from the yarmalik.com repo
# into this one. yarmalik.com stays the source of truth; this is a one-way copy you can re-run any time.
#
#   scripts/content/pull-product-content.sh                      # source defaults to ../yarmalik.com
#   YARMALIK_DIR=/path/to/yarmalik.com scripts/content/pull-product-content.sh
#
# Everything lands in product-content/ in this repo, laid out exactly as in yarmalik.com, so a path in a skill like
# `scripts/voho/produce.mjs` means `product-content/scripts/voho/produce.mjs`. The skills themselves go to
# .claude/skills/ here, where Claude Code loads them. Then commit and push this repo.
#
# Left out on purpose (this repo is public): .env files, the content vault and the downloaded reference videos
# (other creators' work), and the demo-account passwords in capture/marks.json, which are blanked.
set -euo pipefail

HERE="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="${YARMALIK_DIR:-$HERE/../yarmalik.com}"
DST="$HERE/product-content"
[ -f "$SRC/.claude/skills/ccm-content/SKILL.md" ] || { echo "yarmalik.com not found at $SRC (set YARMALIK_DIR)"; exit 1; }

EXCLUDES=(--exclude node_modules --exclude .DS_Store --exclude '.env' --exclude '.env.*' --exclude .git
          --exclude .hyperframes --exclude .thumbnails --exclude snapshots --exclude renders
          --exclude avatar-training-video.mp4)

# The three skills.
mkdir -p "$HERE/.claude/skills"
for p in ccm avc voho; do rsync -a --delete "${EXCLUDES[@]}" "$SRC/.claude/skills/$p-content" "$HERE/.claude/skills/"; done

# Everything the skills reference, same relative paths as in yarmalik.com.
PATHS=(
  package.json package-lock.json
  scripts/content scripts/long scripts/voho scripts/avatar scripts/board scripts/thumbnail
  content/avatar content/references content/skool content/topics content/voho
  docs/specs docs/playbook
  open-source/animation-base
  public/content-automation
  videos/_voho-shared
  videos/freellm-free-claude
  videos/avc-ai-clone-reel videos/avc-dollar-video
  videos/ccm-spreadsheet-dashboard-reel videos/ccm-spreadsheet-tool videos/ccm-turn-a-spreadsheet-into-a-dashboard
  videos/voho-12-where-is-my-order-answered-without videos/voho-order-status-reel videos/voho-property-hum
  videos/voho-saudi-clinic videos/voho-tutorial-build-an-ai-phone-agent
  videos/voho-claims-reel videos/voho-chat-agent-saudi-store
)
for p in "${PATHS[@]}"; do
  [ -e "$SRC/$p" ] || { echo "skip (missing in source): $p"; continue; }
  mkdir -p "$DST/$(dirname "$p")"
  rsync -a --delete "${EXCLUDES[@]}" "$SRC/$p" "$DST/$(dirname "$p")/"
done

# Other creators' videos stay on Yar's machine.
find "$DST/content/references" -maxdepth 1 -name '*.mp4' -delete
# Demo-account logins: keep the email, blank the password.
find "$DST/videos" -name 'marks.json' -exec sed -i '' -E 's/("password"[[:space:]]*:[[:space:]]*")[^"]*"/\1"/' {} +
echo "done: $(du -sh "$DST" | cut -f1) in product-content/"
