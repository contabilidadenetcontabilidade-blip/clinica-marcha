#!/bin/bash
set -e

sudo apt update
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo npm install -g pm2

cd /home/ubuntu/marcha
tar -xzf marcha_code.tar.gz

cd backend
npm install

# Nginx config
sudo tee /etc/nginx/sites-available/default > /dev/null <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo systemctl restart nginx

# PM2
pm2 start index.js --name "marcha-api" || pm2 restart "marcha-api"
pm2 startup | tail -n 1 > pm2_startup.sh
chmod +x pm2_startup.sh
sudo ./pm2_startup.sh
pm2 save

# Certbot
sudo certbot --nginx -d marchacup.com -d www.marchacup.com --non-interactive --agree-tos -m contato@marchacup.com || echo "Certbot failed or domains not pointed yet"
