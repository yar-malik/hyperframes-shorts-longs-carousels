#!/usr/bin/env bash
# Install or refresh the competitor-scan timer on the VM. Run on the box:
#   sudo bash scripts/board/systemd/install.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
cp "$here/competitor-scan.service" "$here/competitor-scan.timer" /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now competitor-scan.timer
systemctl list-timers competitor-scan.timer --no-pager
