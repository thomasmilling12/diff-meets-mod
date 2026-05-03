import { db } from "./database";

export interface ModmailConfig {
  guild_id: string;
  category_id: string | null;
  log_channel_id: string | null;
  enabled: number;
  response_message: string;
}

export interface ModmailThread {
  id: number;
  guild_id: string;
  channel_id: string;
  user_id: string;
  user_tag: string;
  status: string;
  created_at: number;
  closed_at: number | null;
}

function ensureConfig(guildId: string): void {
  db.prepare("INSERT OR IGNORE INTO modmail_config (guild_id) VALUES (?)").run(guildId);
}

export function getModmailConfig(guildId: string): ModmailConfig {
  ensureConfig(guildId);
  return db.prepare("SELECT * FROM modmail_config WHERE guild_id = ?").get(guildId) as unknown as ModmailConfig;
}

export function setModmailConfig(guildId: string, settings: Partial<Omit<ModmailConfig, "guild_id">>): void {
  ensureConfig(guildId);
  for (const [col, val] of Object.entries(settings)) {
    if (val !== undefined) db.prepare(`UPDATE modmail_config SET ${col} = ? WHERE guild_id = ?`).run(val, guildId);
  }
}

export function createModmailThread(guildId: string, channelId: string, userId: string, userTag: string): number {
  const r = db.prepare("INSERT INTO modmail_threads (guild_id, channel_id, user_id, user_tag) VALUES (?, ?, ?, ?)")
    .run(guildId, channelId, userId, userTag);
  return r.lastInsertRowid as number;
}

export function getOpenModmailByUser(guildId: string, userId: string): ModmailThread | null {
  return (db.prepare("SELECT * FROM modmail_threads WHERE guild_id = ? AND user_id = ? AND status = 'open'")
    .get(guildId, userId) as unknown as ModmailThread) ?? null;
}

export function getModmailByChannel(channelId: string): ModmailThread | null {
  return (db.prepare("SELECT * FROM modmail_threads WHERE channel_id = ?").get(channelId) as unknown as ModmailThread) ?? null;
}

export function closeModmailThread(id: number): void {
  db.prepare("UPDATE modmail_threads SET status = 'closed', closed_at = unixepoch() WHERE id = ?").run(id);
}

export function getModmailByUserId(userId: string): { guild_id: string }[] {
  return db.prepare("SELECT guild_id FROM modmail_config WHERE enabled = 1").all() as unknown as { guild_id: string }[];
}

export function getAllEnabledModmailGuilds(): ModmailConfig[] {
  return db.prepare("SELECT * FROM modmail_config WHERE enabled = 1").all() as unknown as ModmailConfig[];
}
