#!/usr/bin/env bash
# به‌روزرسانیِ کد (محتوای data/ دست نمی‌خورد):  cd ~/neuraeco && git pull && sudo bash deploy/update.sh
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)"
rsync -a --delete --exclude data --exclude .git "$SRC"/ /opt/neuraeco/
chown -R neuraeco:neuraeco /opt/neuraeco
systemctl restart neuraeco
echo "به‌روز شد ✓"
