#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Run this ON THE VPS (as root or sudo) after git pull
#  Fixes 404 for /next/static/ (CSS, JS, fonts) so dashboard loads
#  Usage: sudo bash update-nginx-on-vps.sh
# ─────────────────────────────────────────────────────────────
set -e

# Use script's directory as app dir (so run from anywhere)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="${APP_DIR:-$SCRIPT_DIR}"
NGINX_SITE="/etc/nginx/sites-available/websevix"

if [ ! -f "$APP_DIR/nginx.conf" ]; then
  echo "Error: nginx.conf not found at $APP_DIR/nginx.conf"
  exit 1
fi

echo "→ Copying nginx config from $APP_DIR..."
cp "$APP_DIR/nginx.conf" "$NGINX_SITE"

echo "→ Testing nginx config..."
nginx -t

echo "→ Reloading nginx..."
systemctl reload nginx

echo ""
echo "✓ Nginx updated. /next/static/ and /_next/static/ will now serve assets."
echo "  Do a hard refresh (Ctrl+Shift+R) in the browser."
echo ""
