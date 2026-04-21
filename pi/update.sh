#!/usr/bin/env bash
# DIFF Meets Mod — Update Script
# Pulls the latest code from git, rebuilds, and restarts the bot.
# Usage: bash pi/update.sh

set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="diff-meets-mod"

# ── Ensure Node/pnpm are on PATH ───────────────────────────────────────────────
# Source nvm so node/npm are available (nvm installs to ~/.nvm)
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

# Add npm's global bin directory — this is where `npm install -g pnpm` puts pnpm
if command -v npm &>/dev/null; then
  NPM_GLOBAL_BIN="$(npm config get prefix)/bin"
  export PATH="$NPM_GLOBAL_BIN:$PATH"
fi

# Final check — if pnpm still not found, install it
if ! command -v pnpm &>/dev/null; then
  echo "  pnpm not found — installing via npm..."
  npm install -g pnpm
  NPM_GLOBAL_BIN="$(npm config get prefix)/bin"
  export PATH="$NPM_GLOBAL_BIN:$PATH"
fi

echo ""
echo "=== DIFF Meets Mod — Updating ==="
echo "  node: $(node --version 2>/dev/null || echo 'not found')"
echo "  pnpm: $(pnpm --version)"
echo ""

cd "$REPO_DIR"

# ── 1. Git pull ───────────────────────────────────────────────────────────────
echo "[1/4] Pulling latest changes from git..."
git pull

# ── 2. Install any new dependencies ──────────────────────────────────────────
echo "[2/4] Updating dependencies..."
pnpm install --frozen-lockfile

# ── 3. Rebuild ────────────────────────────────────────────────────────────────
echo "[3/4] Rebuilding bot..."
pnpm --filter @workspace/api-server run build

# ── 4. Restart the service ────────────────────────────────────────────────────
echo "[4/4] Restarting service..."
sudo systemctl restart "$SERVICE_NAME"

echo ""
echo "=== Update complete! ==="
sudo systemctl status "$SERVICE_NAME" --no-pager -l
