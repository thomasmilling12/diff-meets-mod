#!/usr/bin/env bash
# DIFF Meets Mod — Update Script
# Pulls the latest code from git, rebuilds, and restarts the bot.
# Usage: bash pi/update.sh

set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="diff-meets-mod"

# ── Ensure Node/pnpm are on PATH ───────────────────────────────────────────────
# Source nvm if present (nvm installs Node to ~/.nvm)
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

# Common pnpm install locations
for PNPM_BIN in \
    "$HOME/.local/share/pnpm" \
    "$HOME/Library/pnpm" \
    "/usr/local/bin" \
    "/usr/bin" \
    "$HOME/.nvm/versions/node/$(ls "$HOME/.nvm/versions/node" 2>/dev/null | sort -V | tail -1)/bin" \
; do
  [ -x "$PNPM_BIN/pnpm" ] && export PATH="$PNPM_BIN:$PATH" && break
done

if ! command -v pnpm &>/dev/null; then
  echo "pnpm not found — installing via npm..."
  npm install -g pnpm
fi

echo "=== DIFF Meets Mod — Updating ==="
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
