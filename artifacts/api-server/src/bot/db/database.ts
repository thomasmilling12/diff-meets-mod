import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { botLogger } from "../logger";

const dbDir = process.env.DB_PATH
  ? path.dirname(process.env.DB_PATH)
  : path.resolve(process.cwd(), "data");

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = process.env.DB_PATH ?? path.resolve(dbDir, "bot.db");
export const db = new DatabaseSync(dbPath);

db.exec(`PRAGMA journal_mode = WAL`);
db.exec(`PRAGMA foreign_keys = ON`);

function addColumn(table: string, column: string, type: string): void {
  try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`); } catch { /* already exists */ }
}

db.exec(`CREATE TABLE IF NOT EXISTS guild_config (
  guild_id TEXT PRIMARY KEY, log_channel_id TEXT, welcome_channel_id TEXT,
  welcome_message TEXT, auto_role_id TEXT, automod_anti_spam INTEGER DEFAULT 0,
  automod_anti_invite INTEGER DEFAULT 0, automod_anti_caps INTEGER DEFAULT 0,
  automod_anti_mention INTEGER DEFAULT 0, automod_anti_links INTEGER DEFAULT 0,
  automod_anti_phishing INTEGER DEFAULT 1
)`);
addColumn("guild_config", "log_messages_channel_id", "TEXT");
addColumn("guild_config", "log_members_channel_id", "TEXT");
addColumn("guild_config", "log_voice_channel_id", "TEXT");
addColumn("guild_config", "log_roles_channel_id", "TEXT");
addColumn("guild_config", "log_server_channel_id", "TEXT");

db.exec(`CREATE TABLE IF NOT EXISTS warnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL, user_id TEXT NOT NULL,
  user_tag TEXT NOT NULL, reason TEXT NOT NULL, moderator_tag TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
)`);

db.exec(`CREATE TABLE IF NOT EXISTS cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL, case_number INTEGER NOT NULL,
  action TEXT NOT NULL, user_id TEXT NOT NULL, user_tag TEXT NOT NULL,
  moderator_id TEXT NOT NULL, moderator_tag TEXT NOT NULL, reason TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()), expires_at INTEGER, active INTEGER DEFAULT 1
)`);

db.exec(`CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL, user_id TEXT NOT NULL,
  user_tag TEXT NOT NULL, note TEXT NOT NULL, moderator_tag TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
)`);

db.exec(`CREATE TABLE IF NOT EXISTS custom_commands (
  id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL,
  trigger TEXT NOT NULL, response TEXT NOT NULL, UNIQUE(guild_id, trigger)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS word_filter (
  id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL,
  word TEXT NOT NULL, UNIQUE(guild_id, word)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS button_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL, message_id TEXT, role_id TEXT NOT NULL,
  label TEXT NOT NULL, emoji TEXT, UNIQUE(guild_id, role_id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS self_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL,
  role_id TEXT NOT NULL, description TEXT, UNIQUE(guild_id, role_id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS escalation_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL,
  warn_count INTEGER NOT NULL, action TEXT NOT NULL, duration INTEGER,
  UNIQUE(guild_id, warn_count)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS raid_config (
  guild_id TEXT PRIMARY KEY, enabled INTEGER DEFAULT 0,
  join_threshold INTEGER DEFAULT 10, time_window INTEGER DEFAULT 10,
  action TEXT DEFAULT 'LOCK', auto_unlock_minutes INTEGER DEFAULT 5
)`);

db.exec(`CREATE TABLE IF NOT EXISTS ticket_config (
  guild_id TEXT PRIMARY KEY, category_id TEXT, support_role_id TEXT,
  log_channel_id TEXT, max_open INTEGER DEFAULT 1,
  panel_channel_id TEXT, panel_message_id TEXT
)`);

db.exec(`CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL, user_id TEXT NOT NULL, user_tag TEXT NOT NULL,
  reason TEXT, status TEXT DEFAULT 'open', claimed_by_tag TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  closed_at INTEGER, closed_by_tag TEXT
)`);
addColumn("tickets", "claimed_by_tag", "TEXT");

db.exec(`CREATE TABLE IF NOT EXISTS verification_config (
  guild_id TEXT PRIMARY KEY, channel_id TEXT, message_id TEXT, role_id TEXT,
  welcome_text TEXT DEFAULT 'Click the button below to verify yourself and gain access to the server.'
)`);

db.exec(`CREATE TABLE IF NOT EXISTS stats_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL, type TEXT NOT NULL, format TEXT NOT NULL,
  UNIQUE(guild_id, type)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS starboard_config (
  guild_id TEXT PRIMARY KEY, channel_id TEXT, threshold INTEGER DEFAULT 3,
  emoji TEXT DEFAULT '⭐', enabled INTEGER DEFAULT 1
)`);

db.exec(`CREATE TABLE IF NOT EXISTS starboard_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL,
  original_message_id TEXT NOT NULL, starboard_message_id TEXT NOT NULL,
  channel_id TEXT NOT NULL, star_count INTEGER DEFAULT 0,
  UNIQUE(guild_id, original_message_id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS giveaways (
  id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL, message_id TEXT, prize TEXT NOT NULL,
  winner_count INTEGER DEFAULT 1, host_id TEXT NOT NULL, host_tag TEXT NOT NULL,
  ends_at INTEGER NOT NULL, ended INTEGER DEFAULT 0, winners TEXT
)`);

db.exec(`CREATE TABLE IF NOT EXISTS modmail_config (
  guild_id TEXT PRIMARY KEY, category_id TEXT, log_channel_id TEXT,
  enabled INTEGER DEFAULT 0,
  response_message TEXT DEFAULT 'Thank you for contacting support! A staff member will get back to you soon.'
)`);

db.exec(`CREATE TABLE IF NOT EXISTS modmail_threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL, user_id TEXT NOT NULL, user_tag TEXT NOT NULL,
  status TEXT DEFAULT 'open', created_at INTEGER NOT NULL DEFAULT (unixepoch()), closed_at INTEGER
)`);

db.exec(`CREATE TABLE IF NOT EXISTS invite_tracking (
  guild_id TEXT PRIMARY KEY, enabled INTEGER DEFAULT 0, log_channel_id TEXT
)`);

db.exec(`CREATE TABLE IF NOT EXISTS invite_uses (
  id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL,
  inviter_id TEXT NOT NULL, inviter_tag TEXT NOT NULL,
  invite_code TEXT NOT NULL, uses INTEGER DEFAULT 0,
  UNIQUE(guild_id, invite_code)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS member_invites (
  guild_id TEXT NOT NULL, user_id TEXT NOT NULL,
  invited_by_id TEXT, invite_code TEXT,
  PRIMARY KEY(guild_id, user_id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS auto_thread_channels (
  guild_id TEXT NOT NULL, channel_id TEXT NOT NULL,
  thread_name_format TEXT DEFAULT '{title}', archive_hours INTEGER DEFAULT 24,
  PRIMARY KEY(guild_id, channel_id)
)`);

botLogger.info({ dbPath }, "Database initialized");
