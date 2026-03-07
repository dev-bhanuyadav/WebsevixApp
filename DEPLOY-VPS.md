# VPS Deploy — android.websevix.com

Next.js app ko VPS pe deploy karne ke steps. Domain: **android.websevix.com**

---

## 1. VPS pe ye cheezein chalao (ek baar)

SSH se VPS pe login karo, phir:

```bash
# Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 (process manager)
sudo npm install -g pm2

# Nginx (reverse proxy + SSL)
sudo apt-get update
sudo apt-get install -y nginx

# Git (agar nahi hai)
sudo apt-get install -y git
```

---

## 2. App folder banao aur repo clone karo

```bash
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www

git clone https://github.com/YOUR_USERNAME/WebsevixApp.git android-websevix
cd android-websevix
```

(GitHub URL apne repo se replace karo.)

---

## 3. Environment variables

VPS pe `.env.production` banao. Local `.env.local` ki copy karo aur ye line set karo:

```env
NEXT_PUBLIC_APP_URL=https://android.websevix.com
```

Baaki sab (MONGODB_URI, JWT_SECRET, etc.) same rakhna jo production ke liye chahiye.

---

## 4. Build aur start

```bash
cd /var/www/android-websevix
npm ci
npm run build
npm run start
```

Browser me http://VPS_IP:3000 check karo. Kaam kare to Ctrl+C karke band karo.

---

## 5. PM2 se daemon ki tarah chalao

```bash
cd /var/www/android-websevix
pm2 start npm --name "websevix-android" -- start
pm2 save
pm2 startup
```

pm2 startup jo command dikhayega woh bhi run karna taaki server restart pe app start ho.

---

## 6. Nginx — android.websevix.com

DNS me android.websevix.com ka A record VPS IP pe point karo.

Phir VPS pe:

```bash
sudo cp /var/www/android-websevix/nginx.android.websevix.com.conf /etc/nginx/sites-available/android.websevix.com
sudo ln -sf /etc/nginx/sites-available/android.websevix.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. SSL (HTTPS) — Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d android.websevix.com
```

Ab https://android.websevix.com open karo.

---

## 8. Code update (redeploy)

```bash
cd /var/www/android-websevix
git pull
npm ci
npm run build
pm2 restart websevix-android
```
