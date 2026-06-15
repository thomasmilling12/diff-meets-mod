---
name: Pi deployment resilience (DIFF Meets Mod)
description: Hard-won lessons keeping the Discord bot online 24/7 on a Raspberry Pi after power blinks, and the Replit→GitHub→Pi deploy flow.
---

# Pi deployment resilience

The bot runs 24/7 on a Raspberry Pi via systemd, synced Replit → GitHub → Pi. Power blinks repeatedly knocked it offline; three independent root causes, all now fixed in code.

## "Running but offline in Discord" — the key trap
**Symptom:** systemd shows `active (running)` but the bot is offline in Discord, with `ConnectTimeoutError` / "Failed to login to Discord" in the logs.

**Why:** the Express web server keeps the Node event loop alive. So when `client.login()` failed at boot (network not ready after a power cut), the old catch block just logged and returned — the process stayed alive forever but never connected. systemd's `Restart=always` never fires because the process never exits.

**Fix:** `client.login()` must retry indefinitely with backoff (5s→60s cap) instead of swallowing the error. A failed login that leaves the process alive is invisible to systemd.

## systemd giving up after a few restarts
Default systemd stops restarting after 5 failures in a short window — exactly what happens when the Pi boots before the router. Service file must set `StartLimitIntervalSec=0` + `StartLimitBurst=0` (never give up) and `RestartSec=15` (let network settle). These live in BOTH `pi/setup.sh` and `pi/update.sh` (update.sh rewrites the service file every run).

## Recurring detached-HEAD on the Pi
The Pi's git repo kept ending up "not currently on a branch", so `git pull && bash pi/update.sh` failed at the pull and update.sh never ran. `update.sh` now auto-recovers (checks `git symbolic-ref`, checks out the remote default branch) BEFORE pulling. Run `bash pi/update.sh` alone — do NOT prefix with `git pull &&`, or the pull failure short-circuits the self-heal.

**Nuclear manual recovery** (when even checkout is stuck): `git fetch origin && git checkout -f main && git reset --hard origin/main && bash pi/update.sh`. Safe because the Pi only ever pulls — DB is gitignored, no local code changes to lose.

## Deploy flow & GitHub auth
- Agent environment CANNOT push (git push blocked). User pushes from the **Replit Shell tab** via `bash pi/git-push.sh "msg"`, then runs `bash pi/update.sh` on the Pi.
- GitHub rejects password auth ("Password authentication is not supported"). Fix once: classic PAT with `repo` scope, then `git remote set-url origin https://<user>:<TOKEN>@github.com/<user>/<repo>.git`. After that git-push.sh works without prompts.
- **Always verify the push actually landed.** A failed push is silent next step: the Pi's `git pull` says "Already up to date" and rebuilds the OLD code. Check `git log origin/main` vs local, or that the pull shows the expected commit range.

## Ignore-able noise in update.sh output
- `Ignored build scripts: better-sqlite3` — bot uses `node:sqlite`, not better-sqlite3. Irrelevant.
- pnpm "Update available" notice — informational only.
