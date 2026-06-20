#!/bin/bash
# 自动重连隧道脚本
while true; do
  echo "$(date): Starting tunnel..."
  ssh -o StrictHostKeyChecking=no \
      -o ServerAliveInterval=30 \
      -o ServerAliveCountMax=3 \
      -i "$HOME/.ssh/id_rsa_localtunnel" \
      -R 80:localhost:3000 localhost.run 2>&1 | tee /tmp/tunnel.log
  echo "$(date): Tunnel died, reconnecting in 5s..."
  sleep 5
done
