#!/usr/bin/env bash
set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="diff-meets-mod"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
CURRENT_USER="$(whoami)"
NODE_MAJOR_REQUIRED=24

export NVM_DIR="$HOME/.nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "nvm not found — installing nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi
source "$NVM_DIR/nvm.sh"

CURRENT_NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "$CURRENT_NODE_MAJOR" -lt "$NODE_MAJOR_REQUIRED" ]; then
  echo "Node.js $(node --version 2>/dev/null || echo 'not found') is too old for node:sqlite. Installing Node.js ${NODE_MAJOR_REQUIRED}..."
  nvm install "$NODE_MAJOR_REQUIRED"
fi

nvm use "$NODE_MAJOR_REQUIRED"
nvm alias default "$NODE_MAJOR_REQUIRED"
NODE_BIN="$(command -v node)"

NPM_GLOBAL_BIN="$(npm config get prefix)/bin"
export PATH="$NPM_GLOBAL_BIN:$PATH"

if ! command -v pnpm &>/dev/null; then
  echo "pnpm not found — installing via npm..."
  npm install -g pnpm
  NPM_GLOBAL_BIN="$(npm config get prefix)/bin"
  export PATH="$NPM_GLOBAL_BIN:$PATH"
fi

echo ""
echo "=== DIFF Meets Mod — Updating ==="
echo "  node: $($NODE_BIN --version)"
echo "  node path: $NODE_BIN"
echo "  pnpm: $(pnpm --version)"
echo ""

cd "$REPO_DIR"

echo "[1/5] Pulling latest changes from git..."
git pull

echo "[2/5] Updating dependencies..."
pnpm install --frozen-lockfile

echo "[3/5] Rebuilding bot..."
pnpm --filter @workspace/api-server run build

echo "[4/5] Updating systemd service Node path..."
sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=DIFF Meets Mod Discord Bot
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${CURRENT_USER}
WorkingDirectory=${REPO_DIR}/artifacts/api-server
ExecStart=${NODE_BIN} --enable-source-maps ${REPO_DIR}/artifacts/api-server/dist/index.mjs
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=${REPO_DIR}/pi/.env
StandardOutput=journal
StandardError=journal
SyslogIdentifier=diff-meets-mod

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME" >/dev/null

echo "[5/5] Restarting service..."
sudo systemctl restart "$SERVICE_NAME"

echo ""
echo "=== Update complete! ==="
sudo systemctl status "$SERVICE_NAME" --no-pager -l
