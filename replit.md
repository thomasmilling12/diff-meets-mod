# Workspace — DIFF Meets Mod

## Overview

pnpm workspace monorepo using TypeScript. Contains the DIFF Meets Mod Discord bot (moderation, auto-mod, logging, role management, custom commands) built on Discord.js v14 + Express 5.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Discord library**: discord.js v14
- **API framework**: Express 5
- **Build**: esbuild

## Bot Features

- **Moderation**: `/ban`, `/unban`, `/kick`, `/mute`, `/unmute`, `/warn`, `/warnings`, `/purge`
- **Auto-Mod**: `/automod setup` (anti-spam, anti-invite, anti-caps, anti-mention, anti-links)
- **Logging**: `/log setchannel` — log all mod actions to a channel
- **Roles**: `/role add/remove/info`
- **Custom Commands**: `/customcmd add/remove/list`
- **Utility**: `/ping`, `/userinfo`, `/serverinfo`, `/help`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-server run dev` — run bot + API server locally
- `pnpm --filter @workspace/api-server run build` — build for production

## Pi 5 Deployment (24/7)

Scripts live in `pi/`:

| Script | Purpose |
|--------|---------|
| `pi/setup.sh` | One-time Pi setup: installs Node, pnpm, builds bot, installs systemd service |
| `pi/update.sh` | Pull latest code + rebuild + restart service |
| `pi/git-push.sh` | Push changes from Replit to GitHub |
| `pi/.env.example` | Copy to `pi/.env` and add your `DISCORD_BOT_TOKEN` |

### Pi Setup Steps

1. Connect this Replit project to GitHub (version control tab)
2. On the Pi: `git clone <your-repo-url> && cd diff-meets-mod`
3. `cp pi/.env.example pi/.env && nano pi/.env` — add your token
4. `bash pi/setup.sh`
5. `sudo systemctl start diff-meets-mod`

### Update Workflow

- **Make changes in Replit** → `bash pi/git-push.sh "your message"`
- **On the Pi** → `bash pi/update.sh`

## Environment Secrets (Replit)

- `DISCORD_BOT_TOKEN` — Discord bot token (set in Replit secrets)
- `SESSION_SECRET` — Express session secret
