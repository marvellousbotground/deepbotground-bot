#!/bin/bash
if [[ -d .git ]]; then git pull; fi
npm install
chmod +x /home/container/cloudflared
/home/container/cloudflared tunnel run marvellous &
node /home/container/index.js