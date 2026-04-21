#!/usr/bin/env bash
# DIFF Meets Mod — Update Script
# Pulls the latest code from git, rebuilds, and restarts the bot.
# Usage: bash pi/update.sh

set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="diff-meets-mod"

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
sudo systemctl status "$SERVICE_NAME" --no-pager
