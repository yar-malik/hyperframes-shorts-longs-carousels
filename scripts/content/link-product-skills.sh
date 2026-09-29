#!/usr/bin/env bash
# Links the CCM / AVC / Voho content skills from the private product-content repo into .claude/skills/, so
# Claude Code picks them up when you open this repo. Run once after cloning product-content (see README).
set -euo pipefail

HERE="$(cd "$(dirname "$0")/../.." && pwd)"
[ -d "$HERE/product-content/.claude/skills" ] || {
  echo "product-content/ is missing. Clone it first:"
  echo "  git clone git@github.com:yar-malik/yarmalik-product-content.git product-content"
  exit 1
}
mkdir -p "$HERE/.claude/skills"
for p in ccm avc voho; do
  rm -rf "$HERE/.claude/skills/$p-content"
  ln -s "../../product-content/.claude/skills/$p-content" "$HERE/.claude/skills/$p-content"
done
echo "linked ccm-content, avc-content, voho-content into .claude/skills/"
