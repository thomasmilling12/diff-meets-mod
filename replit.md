# Workspace — DIFF Meets Mod

## Overview

pnpm workspace monorepo using TypeScript. Contains the DIFF Meets Mod Discord bot (moderation, auto-mod, logging, role management, custom commands, button roles, welcome/auto-role, temp bans, word filter, case system) built on Discord.js v14 + Express 5. Persistent SQLite storage via Node.js built-in `node:sqlite` (no native compilation required).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Discord library**: discord.js v14
- **API framework**: Express 5
- **Database**: Node.js built-in `node:sqlite` (Node 22+, no native build needed)
- **Build**: esbuild

## Bot Features (26 slash commands)

### Moderation
- `/ban` — Ban with DM + case creation
- `/unban` — Unban by user ID
- `/tempban` — Temporary ban (auto-unbans via background checker)
- `/kick` — Kick with DM + case creation
- `/mute` — Timeout with DM
- `/unmute` — Remove timeout
- `/warn` — Warn with DM + case
- `/warnings` — View/clear user warnings
- `/purge` — Bulk delete messages
- `/lock` — Lock/unlock a channel
- `/slowmode` — Set channel slowmode
- `/note` — Private mod notes on users
- `/case` — View mod case history

### Auto-Mod & Config
- `/automod setup/status` — Anti-spam, anti-invite, anti-caps, anti-mention, anti-links, anti-phishing
- `/wordfilter add/remove/list` — Custom blocked word list
- `/log setchannel/disable/status` — Mod action logging
- `/welcome set/disable` — Welcome messages with `{user}`, `{server}`, `{count}` placeholders
- `/autorole set/disable` — Auto-assign role on join
- `/buttonroles add/post` — Button-based self-assign roles
- `/customcmd add/remove/list` — Custom text command responses

### Roles & Utility
- `/role add/remove/info`
- `/announce` — Formatted announcements
- `/ping` — Bot latency
- `/userinfo` — User info + warnings/cases/notes summary
- `/serverinfo` — Server info
- `/help` — Command list

### Always-On Features
- Anti-phishing (blocks known phishing domains)
- Rotating status messages
- Auto-unban of temp-bans (checked every 60s)
- DMs to users on ban/kick/mute/warn

## File Structure

```
artifacts/api-server/
  src/
    bot/
      db/           — SQLite layer (node:sqlite)
        database.ts — DB init + schema
        guildConfig.ts, warnings.ts, cases.ts, notes.ts
        customCommands.ts, wordFilter.ts, buttonRoles.ts
      commands/
        moderation/ — ban, unban, kick, mute, unmute, warn, warnings, purge,
                      tempban, lock, slowmode, note, case
        config/     — log, automod, customcmd, welcome, autorole, wordfilter, buttonroles
        roles/      — role
        utility/    — ping, userinfo, serverinfo, help, announce
      events/       — ready, interactionCreate, messageCreate, guildMemberAdd
      utils/        — modLog, antiphishing, statusRotator, tempbanChecker, logger
  data/bot.db       — SQLite database (gitignored)
pi/
  setup.sh          — One-time Pi setup
  update.sh         — Pull + rebuild + restart on Pi
  git-push.sh       — Push from Replit to GitHub
  .env.example      — Environment variable template
```

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-server run dev` — run bot + API server
- `pnpm --filter @workspace/api-server run build` — build for production
- `bash pi/git-push.sh "message"` — push to GitHub

## Pi 5 Deployment (24/7)

### Pi Setup Steps

1. Connect Replit project to GitHub
2. On Pi: `git clone <repo-url> && cd diff-meets-mod`
3. `cp pi/.env.example pi/.env && nano pi/.env` — add `DISCORD_BOT_TOKEN` and set `DB_PATH=/home/pi/diff-meets-mod/data/bot.db`
4. `bash pi/setup.sh`
5. `sudo systemctl start diff-meets-mod`

### Update Workflow

1. **Make changes in Replit** → in Replit shell: `bash pi/git-push.sh "your message"`
2. **On the Pi**: `bash pi/update.sh`

## Environment Secrets (Replit)

- `DISCORD_BOT_TOKEN` — Discord bot token
- `SESSION_SECRET` — Express session secret

## Important Notes

- `node:sqlite` is used instead of `better-sqlite3` to avoid native compilation issues
- The SQLite database is stored in `data/bot.db` (auto-created, gitignored)
- On the Pi, set `DB_PATH` in `.env` to a persistent location
- All slash commands are deployed globally on bot startup (may take up to an hour to propagate)
