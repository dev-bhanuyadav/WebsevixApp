#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Websevix — VPS Deployment Script (BULLETPROOF VERSION)
#  Run this on your VPS as root or sudo user
#  Usage: bash deploy.sh
# ─────────────────────────────────────────────────────────────
set -e

APP_DIR="/var/www/websevix"
REPO="https://github.com/dev-bhanuyadav/websevix.git"
BRANCH="main"

echo ""
echo "══════════════════════════════════════════"
echo "  Websevix VPS Deploy (Bulletproof)"
echo "══════════════════════════════════════════"

# ── Pull latest code ──────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  echo "→ Pulling latest code..."
  cd "$APP_DIR"
  git pull origin "$BRANCH"
else
  echo "→ Cloning repo..."
  git clone -b "$BRANCH" "$REPO" "$APP_DIR"
  cd "$APP_DIR"
  fi

# ── Check/Create .env.production ─────────────────────────────
if [ ! -f "$APP_DIR/.env.production" ]; then
  echo ""
  echo "⚠  .env.production not found. Creating basic template..."
  cat > "$APP_DIR/.env.production" << 'EOF'
# Websevix Environment Variables
NODE_ENV=production
NEXTAUTH_URL=https://websevix.com

# Database (REQUIRED - Add your MongoDB connection string)
MONGODB_URI=mongodb+srv://your-connection-string-here

# Authentication (Auto-generated)
JWT_SECRET=your-jwt-secret-here
NEXTAUTH_SECRET=auto-generated-below

# Razorpay (Optional - Mock mode if not set)
# RAZORPAY_KEY_ID=rzp_test_your_key
# RAZORPAY_KEY_SECRET=your_secret
# NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key
EOF
  echo "   📝 Template created. Edit $APP_DIR/.env.production with your values."
  echo "   ⚠  At minimum, set MONGODB_URI and re-run deploy."
  exit 1
fi

# Auto-fix missing environment variables
echo "→ Checking environment variables..."
if ! grep -q "NODE_ENV=" .env.production; then
  echo "NODE_ENV=production" >> .env.production
  echo "   ✓ Added NODE_ENV=production"
fi

if ! grep -q "NEXTAUTH_SECRET=" .env.production; then
  echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.production
  echo "   ✓ Added NEXTAUTH_SECRET"
fi

if ! grep -q "NEXTAUTH_URL=" .env.production; then
  echo "NEXTAUTH_URL=https://websevix.com" >> .env.production
  echo "   ✓ Added NEXTAUTH_URL"
fi

# ── Install dependencies (incl. dev — needed for Tailwind/build) ──
echo "→ Installing dependencies..."
npm ci

# ── Build ─────────────────────────────────────────────────────
echo "→ Building Next.js (standalone)..."
npm run build

# ── Copy static assets into standalone folder ────────────────
echo "→ Copying static assets..."

# Verify build output exists
if [ ! -d ".next/static" ]; then
  echo "✗ ERROR: .next/static not found — build may have failed"
  exit 1
fi

# Clean and copy _next/static into standalone
rm -rf .next/standalone/_next
mkdir -p .next/standalone/_next/static
cp -r .next/static/. .next/standalone/_next/static/

CSS_COUNT=$(ls .next/standalone/_next/static/css/ 2>/dev/null | wc -l)
JS_COUNT=$(ls .next/standalone/_next/static/chunks/ 2>/dev/null | wc -l)
echo "   CSS files: $CSS_COUNT"
echo "   JS chunks: $JS_COUNT"
if [ "$CSS_COUNT" -eq 0 ]; then
  echo "✗ WARNING: No CSS files copied! Nginx will serve unstyled pages."
fi

# Fix permissions so nginx (www-data) can read static files
chmod -R 755 .next/standalone/_next/
find .next/standalone/_next/ -type f -exec chmod 644 {} \;

# Preserve runtime-uploaded logos before overwriting public/
UPLOADS_BACKUP="/tmp/websevix_uploads_backup"
if [ -d ".next/standalone/public/uploads" ]; then
  cp -r .next/standalone/public/uploads "$UPLOADS_BACKUP" 2>/dev/null && echo "   Backed up uploads/"
fi
rm -rf .next/standalone/public
cp -r public .next/standalone/public
# Restore runtime uploads (logos uploaded via admin panel)
if [ -d "$UPLOADS_BACKUP" ]; then
  mkdir -p .next/standalone/public/uploads
  cp -r "$UPLOADS_BACKUP/." .next/standalone/public/uploads/ 2>/dev/null && echo "   Restored uploads/"
  rm -rf "$UPLOADS_BACKUP"
fi

# Fix permissions for public folder too
chmod -R 755 .next/standalone/public/
find .next/standalone/public/ -type f -exec chmod 644 {} \;

# ── Copy .env so Next.js can load it (standalone runs from .next/standalone) ─
if [ -f "$APP_DIR/.env.production" ]; then
  cp "$APP_DIR/.env.production" "$APP_DIR/.next/standalone/.env.production"
  echo "→ Copied .env.production to standalone"
fi

# ── Create log dir ────────────────────────────────────────────
mkdir -p /var/log/websevix

# ── Update Nginx config ───────────────────────────────────────
NGINX_SITE="/etc/nginx/sites-available/websevix"
echo "→ Applying Nginx config..."
if [ -f "/etc/nginx/sites-available" ] || [ -d "/etc/nginx/sites-available" ]; then
  cp "$APP_DIR/nginx.conf" "$NGINX_SITE"
  if [ ! -L "/etc/nginx/sites-enabled/websevix" ]; then
    ln -sf "$NGINX_SITE" "/etc/nginx/sites-enabled/websevix"
  fi
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  nginx -t && systemctl reload nginx && echo "   Nginx reloaded ✓"
fi

# ── Restart with PM2 ─────────────────────────────────────────
echo "→ Restarting PM2..."
mkdir -p /var/log/websevix
pm2 delete websevix 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

sleep 3
HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 2>/dev/null || echo "000")

echo ""
echo "✓ Deploy complete!"
echo "  App health: localhost:3000 → $HTTP"
echo "  Open https://websevix.com in incognito (Ctrl+Shift+R to clear cache)"
echo ""
