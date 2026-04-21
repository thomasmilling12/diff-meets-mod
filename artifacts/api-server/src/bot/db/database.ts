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

db.exec(`
  CREATE TABLE IF NOT EXISTS guild_config (
    guild_id TEXT PRIMARY KEY,
    log_channel_id TEXT,
    welcome_channel_id TEXT,
    welcome_message TEXT,
    auto_role_id TEXT,
    automod_anti_spam INTEGER DEFAULT 0,
    automod_anti_invite INTEGER DEFAULT 0,
    automod_anti_caps INTEGER DEFAULT 0,
    automod_anti_mention INTEGER DEFAULT 0,
    automod_anti_links INTEGER DEFAULT 0,
    automod_anti_phishing INTEGER DEFAULT 1
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_tag TEXT NOT NULL,
    reason TEXT NOT NULL,
    moderator_tag TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    case_number INTEGER NOT NULL,
    action TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_tag TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    moderator_tag TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    expires_at INTEGER,
    active INTEGER DEFAULT 1
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_tag TEXT NOT NULL,
    note TEXT NOT NULL,
    moderator_tag TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS custom_commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    trigger TEXT NOT NULL,
    response TEXT NOT NULL,
    UNIQUE(guild_id, trigger)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS word_filter (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    word TEXT NOT NULL,
    UNIQUE(guild_id, word)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS button_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT,
    role_id TEXT NOT NULL,
    label TEXT NOT NULL,
    emoji TEXT,
    UNIQUE(guild_id, role_id)
  )
`);

botLogger.info({ dbPath }, "Database initialized");
