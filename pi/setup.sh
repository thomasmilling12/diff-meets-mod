#!/usr/bin/env bash
# DIFF Meets Mod — Raspberry Pi 5 Setup Script
# Run once on your Pi to install everything and configure the systemd service.
# Usage: bash setup.sh

set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="diff-meets-mod"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
CURRENT_USER="$(whoami)"

echo "=== DIFF Meets Mod — Pi Setup ==="
echo "Repo directory: $REPO_DIR"
echo "Running as: $CURRENT_USER"
echo ""

# ── 1. Check Node.js ──────────────────────────────────────────────────────────
echo "[1/5] Checking Node.js..."
if ! command -v node &>/dev/null; then
  echo "Node.js not found. Installing via nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1091
  source "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
  nvm alias default 20
else
  NODE_VER=$(node --version)
  echo "  Node.js $NODE_VER found."
fi

# ── 2. Check / install pnpm ────────────────────────────────────────────────────
echo "[2/5] Checking pnpm..."
if ! command -v pnpm &>/dev/null; then
  echo "  Installing pnpm..."
  npm install -g pnpm
else
  echo "  pnpm $(pnpm --version) found."
fi

# ── 3. Install dependencies ────────────────────────────────────────────────────
echo "[3/5] Installing workspace dependencies..."
cd "$REPO_DIR"
pnpm install --frozen-lockfile

# ── 4. Build the bot ─────────────────────────────────────────────────────────
echo "[4/5] Building the bot..."
pnpm --filter @workspace/api-server run build

# ── 5. Create and enable systemd service ──────────────────────────────────────
echo "[5/5] Installing systemd service..."

# Resolve the node binary path
NODE_BIN="$(command -v node)"

# Write the service file (requires sudo)
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
sudo systemctl enable "$SERVICE_NAME"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Before starting the bot, create your environment file:"
echo "  cp pi/.env.example pi/.env"
echo "  nano pi/.env   # add your DISCORD_BOT_TOKEN"
echo ""
echo "Then start the bot:"
echo "  sudo systemctl start $SERVICE_NAME"
echo ""
echo "Check status:"
echo "  sudo systemctl status $SERVICE_NAME"
echo "  sudo journalctl -u $SERVICE_NAME -f"
