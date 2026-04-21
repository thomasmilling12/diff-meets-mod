# Workspace — DIFF Meets Mod

## Overview

pnpm workspace monorepo using TypeScript. DIFF Meets Mod is a full-featured Discord moderation bot (Discord.js v14 + Express 5 + SQLite). 40 slash commands. Designed to run 24/7 on a Raspberry Pi 5, synced via GitHub.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Pi requirement**: Node.js 24 or newer is required because the bot uses built-in `node:sqlite`
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Discord library**: discord.js v14
- **API framework**: Express 5
- **Database**: Node.js built-in `node:sqlite` (no native build needed)
- **Build**: esbuild

## Bot Features (40 slash commands)

### Moderation
- `/ban` `/unban` `/tempban` — Ban, unban, temporary ban (auto-unbans)
- `/kick` `/mute` `/unmute` — Kick, timeout, remove timeout
- `/warn` — Warn with DM + auto-escalation trigger
- `/warnings list/remove/clear` — Paginated warnings with per-ID removal
- `/purge` — Bulk delete messages
- `/lock` `/slowmode` — Lock/unlock channels, set slowmode
- `/note` — Private mod notes on users
- `/case view/list/edit` — Paginated case history with reason editing
- `/ticket` — Open support ticket (private channel)
- `/close-ticket` — Close ticket with transcript to log channel

### Ticket System
- `/ticket-setup config` — Set support role, category, log channel, max tickets
- `/ticket-setup panel` — Post a "Open Ticket" button panel
- Panel button → auto-creates private channel, pings support role
- Close button / `/close-ticket` → saves transcript, deletes channel

### Verification
- `/verify-setup send` — Post a "Verify" button in a channel
- `/verify-setup disable/status` — Manage verification
- Click button → user receives configured role

### Auto-Mod & Safety
- `/automod setup/status` — Anti-spam, anti-invite, anti-caps, anti-mention, anti-links, anti-phishing
- `/wordfilter add/remove/list` — Custom blocked words
- `/escalation add/remove/list` — Auto-punish at X warnings (mute/kick/ban)
- `/raid setup/enable/disable/unlock/status` — Raid detection + auto-lockdown

### Logging (per-type channels)
- `/logconfig set/disable/status` — Set separate channels for mod, messages, members, voice, roles
- Message edits & deletes → messages log channel
- Member join (with new-account flag) & leave → members log channel
- Voice join/leave/move/mute → voice log channel
- Role additions/removals, nickname changes → roles log channel

### Config & Stats
- `/log setchannel/disable/status` — Quick mod log channel
- `/welcome set/disable` — Welcome messages with `{user}`, `{server}`, `{count}`
- `/autorole set/disable` — Auto-assign role on join
- `/buttonroles add/post` — Button-based self-assign roles
- `/customcmd add/remove/list` — Custom text command responses
- `/stats-channel add/remove/list` — Auto-updating voice channels (members/online/bots/channels/boosts, refreshes every 10 min)

### Role Management
- `/role add/remove/info` — Assign/remove/inspect roles
- `/self-role add/remove/list` — Manage self-assignable roles
- `/join-role` `/leave-role` — User self-service roles
- `/role-id` — Get role ID
- `/mass-role` — Bulk add/remove role from all members

### Utility
- `/poll` — Reaction poll (up to 5 options, optional auto-close with results)
- `/announce` — Formatted announcement embed
- `/ping` `/userinfo` `/serverinfo` `/help` — Standard utility commands

### Always-On Features
- Anti-phishing (blocks known phishing domains on message)
- Rotating status messages
- Auto-unban of temp-bans (checked every 60s)
- Stats channels refresh every 10 minutes
- DMs on ban/kick/mute/warn

### Web Dashboard
- Available at `http://<pi-ip>:<PORT>/dashboard`
- Protected by `DASHBOARD_TOKEN` env var (pass as `?token=...`)
- Lists all guilds → per-guild case history (paginated) + config summary

## File Structure

```
artifacts/api-server/
  src/
    bot/
      db/           — SQLite layer
        database.ts       — DB init + schema + migration helper
        guildConfig.ts    — Guild settings + extended log channels
        warnings.ts cases.ts notes.ts customCommands.ts
        wordFilter.ts buttonRoles.ts selfRoles.ts
        tickets.ts verification.ts statsChannels.ts
        escalation.ts raidProtection.ts
      commands/
        moderation/ — ban, unban, kick, mute, unmute, warn, warnings,
                      purge, tempban, lock, slowmode, note, case,
                      ticket, closeticket
        config/     — log, automod, customcmd, welcome, autorole,
                      wordfilter, buttonroles, logconfig, escalationconfig,
                      raidconfig, ticketsetup, verifysetup, statschannel
        roles/      — role, selfrole, joinrole, leaverole, roleid, massrole
        utility/    — ping, userinfo, serverinfo, help, announce, poll
      events/       — ready, interactionCreate, messageCreate,
                      guildMemberAdd, guildMemberRemove, guildMemberUpdate,
                      messageUpdate, messageDelete, voiceStateUpdate
      utils/        — modLog, antiphishing, statusRotator, tempbanChecker,
                      escalationHandler, raidProtectionHandler,
                      statsUpdater, ticketTranscript
    dashboard.ts    — Web dashboard routes (Express)
    app.ts          — Express app (/api + /dashboard)
  data/bot.db       — SQLite database (gitignored)
pi/
  setup.sh          — One-time Pi setup
  update.sh         — Pull + rebuild + restart on Pi
  git-push.sh       — Push from Replit to GitHub
  .env.example      — Environment variable template (includes DASHBOARD_TOKEN)
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
3. `cp pi/.env.example pi/.env && nano pi/.env` — add `DISCORD_BOT_TOKEN`, `DB_PATH`, and optionally `DASHBOARD_TOKEN`
4. `bash pi/setup.sh` — installs/uses Node.js 24 and writes the systemd service to that Node path
5. `sudo systemctl start diff-meets-mod`

### Update Workflow

1. **Make changes in Replit** → in Replit shell: `bash pi/git-push.sh "your message"`
2. **On the Pi**: `bash pi/update.sh` — also upgrades to Node.js 24 and rewrites the service if the old Node path was still used

## Environment Secrets (Replit)

- `DISCORD_BOT_TOKEN` — Discord bot token
- `SESSION_SECRET` — Express session secret

## Pi Environment Variables

- `DISCORD_BOT_TOKEN` — Discord bot token
- `PORT` — Express server port (default: 3000)
- `DB_PATH` — Path to SQLite DB file
- `NODE_ENV=production`
- `DASHBOARD_TOKEN` — Protects `/dashboard` (pass as `?token=...`)

## Important Notes

- `node:sqlite` is used instead of `better-sqlite3` to avoid native compilation issues on Pi
- If the Pi journal shows `No such built-in module: node:sqlite`, the service is still using old Node.js 20; run the latest `bash pi/update.sh` or rerun `bash pi/setup.sh`
- The SQLite database is stored in `data/bot.db` (auto-created, gitignored)
- On the Pi, set `DB_PATH` in `.env` to a persistent path (e.g. `/home/pi/diff-meets-mod/data/bot.db`)
- All slash commands are deployed globally on bot startup (may take up to an hour to propagate globally)
- The `addColumn()` helper in `database.ts` safely migrates existing DBs without destroying data
- Stats channels are rate-limited to one name update per 10 minutes (Discord API limit)
