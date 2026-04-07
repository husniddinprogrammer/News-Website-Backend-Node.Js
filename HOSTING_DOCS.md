# News Portal API — Hosting & Deployment Guide

> **Server:** Ubuntu 22.04 LTS (VPS)
> **Tavsiya etilgan hostinglar:** Hetzner, DigitalOcean, Contabo, Beget VPS
> **Minimal server:** 2 CPU / 2GB RAM / 20GB SSD

---

## MUNDARIJA

1. [Server sotib olish](#1-server-sotib-olish)
2. [Server dastlabki sozlash](#2-server-dastlabki-sozlash)
3. [Node.js o'rnatish](#3-nodejs-ornatish)
4. [PostgreSQL o'rnatish](#4-postgresql-ornatish)
5. [Nginx o'rnatish](#5-nginx-ornatish)
6. [SSL sertifikat (HTTPS)](#6-ssl-sertifikat-https)
7. [Loyihani serverga yuklash](#7-loyihani-serverga-yuklash)
8. [PM2 bilan ishga tushirish](#8-pm2-bilan-ishga-tushirish)
9. [Nginx konfiguratsiyasi](#9-nginx-konfiguratsiyasi)
10. [Firewall sozlash](#10-firewall-sozlash)
11. [Yangilash (deploy update)](#11-yangilash-deploy-update)
12. [Monitoring](#12-monitoring)

---

## 1. Server sotib olish

### Hetzner (tavsiya — arzon va ishonchli)
1. `hetzner.com` ga o'ting → **Cloud** → **Create Server**
2. **Location:** Nuremberg yoki Helsinki
3. **Image:** Ubuntu 22.04
4. **Type:** CX21 (2 vCPU, 4GB RAM) — oyiga ~6€
5. **SSH Key** qo'shing (quyida yaratamiz)
6. **Create & Buy** bosing

### SSH Key yaratish (local kompyuterda)
```bash
# Windows PowerShell yoki Git Bash da:
ssh-keygen -t ed25519 -C "your@email.com"
# Enter bosib davom eting (passphrase ixtiyoriy)

# Public keyni ko'rish (Hetzner ga shu keyni qo'shish kerak):
cat ~/.ssh/id_ed25519.pub
```

### Serverga ulanish
```bash
ssh root@YOUR_SERVER_IP
# Misol: ssh root@65.108.100.200
```

---

## 2. Server dastlabki sozlash

```bash
# Paketlarni yangilash
apt update && apt upgrade -y

# Zarur vositalar
apt install -y curl git wget nano ufw build-essential

# Yangi sudo foydalanuvchi yaratish (rootdan ishlamaslik uchun)
adduser deploy
usermod -aG sudo deploy

# SSH keyni deploy userga ko'chirish
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# deploy user bilan ulanishni tekshirish (yangi terminal oching):
# ssh deploy@YOUR_SERVER_IP
```

---

## 3. Node.js o'rnatish

```bash
# deploy user sifatida:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Versiyani tekshirish
node --version   # v20.x.x bo'lishi kerak
npm --version

# PM2 o'rnatish (global)
sudo npm install -g pm2
```

---

## 4. PostgreSQL o'rnatish

```bash
# PostgreSQL o'rnatish
sudo apt install -y postgresql postgresql-contrib

# Statusni tekshirish
sudo systemctl status postgresql

# PostgreSQL ga kirish
sudo -u postgres psql

# Ichida (SQL):
CREATE DATABASE news_website;
CREATE USER news_user WITH ENCRYPTED PASSWORD 'StrongPassword123!';
GRANT ALL PRIVILEGES ON DATABASE news_website TO news_user;
\q
```

> **Eslatma:** `StrongPassword123!` o'rniga o'zingizning kuchli parolingizni qo'ying.

---

## 5. Nginx o'rnatish

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Tekshirish:
sudo systemctl status nginx
```

---

## 6. SSL sertifikat (HTTPS)

```bash
# Certbot o'rnatish
sudo apt install -y certbot python3-certbot-nginx

# Domain uchun SSL olish
sudo certbot --nginx -d api.news-portal.uz

# Email kiritasiz, shartlarga rozilik bildirasiz
# Certbot avtomatik Nginx konfiguratsiyasini yangilaydi

# Avtomatik yangilash tekshirish
sudo certbot renew --dry-run
```

> **Muhim:** SSL olishdan oldin domain `api.news-portal.uz` server IP ga ko'rsatilgan bo'lishi kerak!

### Domain DNS sozlash (domenda)
```
Type    Name    Value
A       api     YOUR_SERVER_IP
A       admin   YOUR_SERVER_IP
A       @       YOUR_SERVER_IP
```

---

## 7. Loyihani serverga yuklash

### Variant A — GitHub orqali (tavsiya)

```bash
# Serverda:
cd /var/www
sudo mkdir news-portal-api
sudo chown deploy:deploy news-portal-api
cd news-portal-api

# GitHub dan clone qilish
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# .env fayl yaratish
nano .env
```

### .env faylini to'ldirish (serverda)
```env
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

DATABASE_URL="postgresql://news_user:StrongPassword123!@localhost:5432/news_website?schema=public"

JWT_ACCESS_SECRET=minimum_32_belgili_juda_murakkab_kalit_1
JWT_REFRESH_SECRET=minimum_32_belgili_juda_murakkab_kalit_2
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=300

ELASTICSEARCH_NODE=http://localhost:9200

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10

UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp,image/gif

USE_S3=false

LOG_LEVEL=info
LOG_DIR=logs

CORS_ORIGIN=https://news-portal.uz,https://admin.news-portal.uz

VIEW_DEDUP_MINUTES=60
TOP_NEWS_CACHE_TTL=120
```

```bash
# Ctrl+X, Y, Enter — saqlash

# Dependencylarni o'rnatish
npm install --omit=dev

# uploads va logs papkalarini yaratish
mkdir -p uploads logs

# Prisma generate va migrate
npx prisma generate
npx prisma migrate deploy

# Seed (ixtiyoriy — faqat birinchi marta)
node prisma/seed.js
```

### Variant B — SCP orqali (GitHub yo'q bo'lsa)

```bash
# Local kompyuterda (Git Bash / PowerShell):
scp -r "c:/Users/User/Desktop/news site backend" deploy@YOUR_SERVER_IP:/var/www/news-portal-api
```

---

## 8. PM2 bilan ishga tushirish

```bash
cd /var/www/news-portal-api

# PM2 bilan ishga tushirish
pm2 start src/server.js --name "news-portal-api"

# Yoki ecosystem file bilan (tavsiya):
nano ecosystem.config.js
```

```js
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'news-portal-api',
    script: 'src/server.js',
    instances: 'max',        // CPU yadrolari soni
    exec_mode: 'cluster',    // Load balancing
    watch: false,
    max_memory_restart: '500M',
    env_production: {
      NODE_ENV: 'production',
    },
    error_file: 'logs/pm2-error.log',
    out_file: 'logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};
```

```bash
# Ecosystem bilan ishga tushirish
pm2 start ecosystem.config.js --env production

# Server reboot da avtomatik ishga tushirish
pm2 startup
# Chiqgan buyruqni copy qilib ishga tushiring

pm2 save

# Statusni tekshirish
pm2 status
pm2 logs news-portal-api
```

---

## 9. Nginx konfiguratsiyasi

```bash
sudo nano /etc/nginx/sites-available/news-portal-api
```

```nginx
# /etc/nginx/sites-available/news-portal-api

server {
    listen 80;
    server_name api.news-portal.uz;

    # Certbot SSL qo'shgandan keyin bu bo'lim avtomatik to'ldiriladi
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.news-portal.uz;

    # SSL (Certbot tomonidan to'ldiriladi)
    ssl_certificate /etc/letsencrypt/live/api.news-portal.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.news-portal.uz/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;

    # Upload fayl hajmi
    client_max_body_size 10M;

    # Gzip
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;

    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # Static uploads
    location /uploads/ {
        alias /var/www/news-portal-api/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        add_header Cross-Origin-Resource-Policy "cross-origin";
    }
}
```

```bash
# Konfiguratsiyani yoqish
sudo ln -s /etc/nginx/sites-available/news-portal-api /etc/nginx/sites-enabled/

# Konfiguratsiya to'g'riligini tekshirish
sudo nginx -t

# Nginx restart
sudo systemctl reload nginx
```

---

## 10. Firewall sozlash

```bash
# Faqat kerakli portlarni ochish
sudo ufw default deny incoming
sudo ufw default allow outgoing

sudo ufw allow ssh         # 22-port
sudo ufw allow 'Nginx Full' # 80 va 443-portlar

# Yoqish
sudo ufw enable

# Statusni ko'rish
sudo ufw status
```

> **Muhim:** 3000-port tashqariga ochilmasin — Node.js faqat Nginx orqali ishlaydi.

---

## 11. Yangilash (deploy update)

Kodni o'zgartirgandan keyin serverni yangilash:

```bash
# Serverga kiring
ssh deploy@YOUR_SERVER_IP
cd /var/www/news-portal-api

# Yangi kodni tortish
git pull origin main

# Yangi paketlar o'rnatish (agar package.json o'zgarga)
npm install --omit=dev

# Prisma regenerate (schema o'zgarga)
npx prisma generate
npx prisma migrate deploy

# PM2 restart
pm2 restart news-portal-api

# Log ko'rish
pm2 logs news-portal-api --lines 50
```

### Avtomatik deploy (GitHub Actions) — ixtiyoriy

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_IP }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/news-portal-api
            git pull origin main
            npm install --omit=dev
            npx prisma generate
            npx prisma migrate deploy
            pm2 restart news-portal-api
```

---

## 12. Monitoring

```bash
# Real-time monitoring
pm2 monit

# Loglarni ko'rish
pm2 logs news-portal-api
pm2 logs news-portal-api --err   # faqat errorlar

# Server resurslar
htop

# Disk
df -h

# Nginx loglar
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL ulanishlar
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## XULOSA — Qadamlar tartibi

```
1. ✅ VPS server sotib oling (Hetzner)
2. ✅ SSH key yarating va ulaning
3. ✅ Ubuntu server sozlang (deploy user)
4. ✅ Node.js 20 o'rnating
5. ✅ PostgreSQL o'rnating va DB yarating
6. ✅ Nginx o'rnating
7. ✅ Domain DNS ni server IP ga yo'naltiring
8. ✅ SSL sertifikat oling (Certbot)
9. ✅ Loyihani /var/www/news-portal-api ga clone qiling
10. ✅ .env faylini to'ldiring
11. ✅ npm install + prisma migrate + seed
12. ✅ PM2 bilan ishga tushiring
13. ✅ Nginx konfiguratsiyasini yozing va reload qiling
14. ✅ Firewall sozlang
15. ✅ https://api.news-portal.uz/health — tekshiring
```

---

## Tekshirish URL lari

```
https://api.news-portal.uz/health
https://api.news-portal.uz/api/v1/news
https://api.news-portal.uz/api-docs
```
