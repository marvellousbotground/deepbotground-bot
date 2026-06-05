#!/bin/bash

cd /home/container

echo "Updating bot from GitHub..."

if [[ -d .git ]]; then
    git pull
else
    echo "No .git folder found. Server is not connected to GitHub."
fi

echo "Installing packages..."
npm install

echo "Starting Cloudflare tunnel..."
chmod +x /home/container/cloudflared
/home/container/cloudflared tunnel run marvellous &

echo "Starting bot..."
node /home/container/index.js