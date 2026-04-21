#!/usr/bin/env bash
# DIFF Meets Mod — Push Changes from Replit to GitHub
# Run this from inside Replit when you want to push updates.
# Usage: bash pi/git-push.sh "Your commit message"

set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

MSG="${1:-Update bot}"

echo "=== Pushing to GitHub ==="
git add -A
git commit -m "$MSG" 2>/dev/null || echo "(Nothing new to commit)"
git push
echo ""
echo "Done! Now run on your Pi:  bash pi/update.sh"
