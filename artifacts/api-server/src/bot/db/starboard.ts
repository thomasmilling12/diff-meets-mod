import { db } from "./database";

export interface StarboardConfig {
  guild_id: string;
  channel_id: string | null;
  threshold: number;
  emoji: string;
  enabled: number;
}

export interface StarboardMessage {
  id: number;
  guild_id: string;
  original_message_id: string;
  starboard_message_id: string;
  channel_id: string;
  star_count: number;
}

function ensureConfig(guildId: string): void {
  db.prepare("INSERT OR IGNORE INTO starboard_config (guild_id) VALUES (?)").run(guildId);
}

export function getStarboardConfig(guildId: string): StarboardConfig {
  ensureConfig(guildId);
  return db.prepare("SELECT * FROM starboard_config WHERE guild_id = ?").get(guildId) as unknown as StarboardConfig;
}

export function setStarboardConfig(guildId: string, settings: Partial<Omit<StarboardConfig, "guild_id">>): void {
  ensureConfig(guildId);
  for (const [col, val] of Object.entries(settings)) {
    if (val !== undefined) db.prepare(`UPDATE starboard_config SET ${col} = ? WHERE guild_id = ?`).run(val, guildId);
  }
}

export function getStarboardEntry(guildId: string, originalMessageId: string): StarboardMessage | null {
  return (db.prepare("SELECT * FROM starboard_messages WHERE guild_id = ? AND original_message_id = ?")
    .get(guildId, originalMessageId) as unknown as StarboardMessage) ?? null;
}

export function upsertStarboardEntry(guildId: string, originalMessageId: string, starboardMessageId: string, channelId: string, starCount: number): void {
  db.prepare("INSERT OR REPLACE INTO starboard_messages (guild_id, original_message_id, starboard_message_id, channel_id, star_count) VALUES (?, ?, ?, ?, ?)")
    .run(guildId, originalMessageId, starboardMessageId, channelId, starCount);
}

export function updateStarCount(guildId: string, originalMessageId: string, starCount: number): void {
  db.prepare("UPDATE starboard_messages SET star_count = ? WHERE guild_id = ? AND original_message_id = ?")
    .run(starCount, guildId, originalMessageId);
}
