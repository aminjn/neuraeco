#!/usr/bin/env bash
# نصبِ سایتِ نورا (neuraeco) روی سرورِ خامِ Ubuntu (آروان‌کلاد).
# استفاده (با root):
#   sudo bash deploy/install.sh  DOMAIN  ADMIN_USER  ADMIN_PASS
# مثال:
#   sudo bash deploy/install.sh neuraeco.ir admin 'S3cure-Pass!'
set -euo pipefail
DOMAIN="${1:-}"; AUSER="${2:-}"; APASS="${3:-}"
[ -n "$DOMAIN" ] || read -rp "دامنه (مثلاً neuraeco.ir): " DOMAIN
[ -n "$AUSER" ] || read -rp "نام کاربریِ سوپرادمین: " AUSER
while [ "${#APASS}" -lt 8 ]; do
  [ -n "$APASS" ] && echo "رمز باید حداقل ۸ نویسه باشد."
  read -rsp "رمزِ سوپرادمین (حداقل ۸ نویسه): " APASS; echo
done
DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN%%/*}"; DOMAIN="${DOMAIN#www.}"
APP=/opt/neuraeco
SRC="$(cd "$(dirname "$0")/.." && pwd)"
export DEBIAN_FRONTEND=noninteractive

echo "==> بسته‌های پایه"
apt-get update -y
apt-get install -y nginx curl ca-certificates xz-utils rsync

need_node() { ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 18 ]; }
if need_node; then
  echo "==> Node.js"
  apt-get install -y nodejs >/dev/null 2>&1 || true
fi
if need_node; then
  # مخزنِ اوبونتو قدیمی بود: باینریِ رسمیِ Node از nodejs.org، وگرنه آینهٔ npmmirror
  V=v20.18.0; F=node-$V-linux-x64.tar.xz
  curl -fsSL --max-time 120 "https://nodejs.org/dist/$V/$F" -o /tmp/$F \
    || curl -fsSL --max-time 120 "https://registry.npmmirror.com/-/binary/node/$V/$F" -o /tmp/$F
  tar -xJf /tmp/$F -C /usr/local --strip-components=1
fi
echo "node $(node -v)"

echo "==> کپیِ برنامه در $APP"
id neuraeco >/dev/null 2>&1 || useradd --system --home "$APP" --shell /usr/sbin/nologin neuraeco
mkdir -p "$APP"
if [ "$SRC" != "$APP" ]; then rsync -a --delete --exclude data --exclude .git "$SRC"/ "$APP"/; fi
mkdir -p "$APP/data/uploads"
chown -R neuraeco:neuraeco "$APP"
sudo -u neuraeco node "$APP/server.js" set-admin "$AUSER" "$APASS"

echo "==> سرویسِ systemd"
cat > /etc/systemd/system/neuraeco.service <<UNIT
[Unit]
Description=neuraeco site
After=network.target

[Service]
User=neuraeco
WorkingDirectory=$APP
Environment=PORT=3000 HOST=127.0.0.1
ExecStart=$(command -v node) $APP/server.js
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now neuraeco
systemctl restart neuraeco

echo "==> nginx"
cat > /etc/nginx/sites-available/neuraeco <<NGX
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name $DOMAIN www.$DOMAIN _;
    client_max_body_size 10m;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$http_x_forwarded_proto;
    }
}
NGX
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/neuraeco /etc/nginx/sites-enabled/neuraeco
nginx -t && systemctl reload nginx
command -v ufw >/dev/null 2>&1 && ufw allow 80/tcp >/dev/null 2>&1 || true

sleep 1
curl -fsS -o /dev/null -w "local check: %{http_code}\n" http://127.0.0.1/ || true
echo
echo "تمام شد ✓  سایت: http://$DOMAIN   سوپرادمین: http://$DOMAIN/admin"
echo "SSL: در پنلِ CDNِ آروان دامنه را اضافه کنید، رکوردِ A را به IPِ همین سرور بدهید و HTTPS را روشن کنید."
