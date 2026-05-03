import { db } from "./database";

export interface StickyMessage {
  guild_id: string;
  channel_id: string;
  content: string;
  last_message_id: string | null;
}

export function setSticky(guildId: string, channelId: string, content: string): void {
  db.prepare("INSERT OR REPLACE INTO sticky_messages (guild_id, channel_id, content, last_message_id) VALUES (?, ?, ?, NULL)")
    .run(guildId, channelId, content);
}

export function getSticky(guildId: string, channelId: string): StickyMessage | null {
  return (db.prepare("SELECT * FROM sticky_messages WHERE guild_id = ? AND channel_id = ?")
    .get(guildId, channelId) as unknown as StickyMessage) ?? null;
}

export function clearSticky(guildId: string, channelId: string): boolean {
  const r = db.prepare("DELETE FROM sticky_messages WHERE guild_id = ? AND channel_id = ?").run(guildId, channelId);
  return (r.changes as number) > 0;
}

export function updateStickyMessageId(guildId: string, channelId: string, messageId: string): void {
  db.prepare("UPDATE sticky_messages SET last_message_id = ? WHERE guild_id = ? AND channel_id = ?")
    .run(messageId, guildId, channelId);
}

export function getGuildStickyChannels(guildId: string): StickyMessage[] {
  return db.prepare("SELECT * FROM sticky_messages WHERE guild_id = ?").all(guildId) as unknown as StickyMessage[];
}
