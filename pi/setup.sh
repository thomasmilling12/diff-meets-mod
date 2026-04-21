#!/usr/bin/env bash
set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="diff-meets-mod"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
CURRENT_USER="$(whoami)"
NODE_MAJOR_REQUIRED=24

echo "=== DIFF Meets Mod — Pi Setup ==="
echo "Repo directory: $REPO_DIR"
echo "Running as:     $CURRENT_USER"
echo ""

echo "[1/5] Checking Node.js ${NODE_MAJOR_REQUIRED}..."

export NVM_DIR="$HOME/.nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "  Installing nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi
source "$NVM_DIR/nvm.sh"

CURRENT_NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "$CURRENT_NODE_MAJOR" -lt "$NODE_MAJOR_REQUIRED" ]; then
  echo "  Installing Node.js ${NODE_MAJOR_REQUIRED}..."
  nvm install "$NODE_MAJOR_REQUIRED"
else
  echo "  Node.js $(node --version) found."
fi

nvm use "$NODE_MAJOR_REQUIRED"
nvm alias default "$NODE_MAJOR_REQUIRED"
NODE_BIN="$(command -v node)"

echo "  Using $($NODE_BIN --version) at $NODE_BIN"

echo "[2/5] Checking pnpm..."
NPM_GLOBAL_BIN="$(npm config get prefix)/bin"
export PATH="$NPM_GLOBAL_BIN:$PATH"

if ! command -v pnpm &>/dev/null; then
  echo "  Installing pnpm..."
  npm install -g pnpm
else
  echo "  pnpm $(pnpm --version) found."
fi

NPM_GLOBAL_BIN="$(npm config get prefix)/bin"
PROFILE_LINE="export PATH=\"$NPM_GLOBAL_BIN:\$PATH\""
if ! grep -qF "$NPM_GLOBAL_BIN" "$HOME/.profile" 2>/dev/null; then
  echo "" >> "$HOME/.profile"
  echo "$PROFILE_LINE" >> "$HOME/.profile"
  echo "  Added npm global bin to ~/.profile."
fi

echo "[3/5] Installing workspace dependencies..."
cd "$REPO_DIR"
pnpm install --frozen-lockfile

echo "[4/5] Building the bot..."
pnpm --filter @workspace/api-server run build

echo "[5/5] Installing systemd service..."
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
echo "Using Node: $($NODE_BIN --version)"
echo "Service file: $SERVICE_FILE"
echo ""
echo "If you have not created the env file yet:"
echo "  cp pi/.env.example pi/.env"
echo "  nano pi/.env"
echo ""
echo "Start or restart the bot:"
echo "  sudo systemctl restart $SERVICE_NAME"
echo ""
echo "Check status:"
echo "  sudo systemctl status $SERVICE_NAME --no-pager -l"
echo "  sudo journalctl -u $SERVICE_NAME -n 80 --no-pager"
