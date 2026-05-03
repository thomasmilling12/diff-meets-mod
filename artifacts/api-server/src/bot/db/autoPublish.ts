import { db } from "./database";

export function enableAutoPublish(guildId: string, channelId: string): void {
  db.prepare("INSERT OR IGNORE INTO auto_publish_channels (guild_id, channel_id) VALUES (?, ?)").run(guildId, channelId);
}

export function disableAutoPublish(guildId: string, channelId: string): boolean {
  const r = db.prepare("DELETE FROM auto_publish_channels WHERE guild_id = ? AND channel_id = ?").run(guildId, channelId);
  return (r.changes as number) > 0;
}

export function isAutoPublish(guildId: string, channelId: string): boolean {
  return !!(db.prepare("SELECT 1 FROM auto_publish_channels WHERE guild_id = ? AND channel_id = ?").get(guildId, channelId));
}

export function getAutoPublishChannels(guildId: string): string[] {
  return (db.prepare("SELECT channel_id FROM auto_publish_channels WHERE guild_id = ?").all(guildId) as unknown as { channel_id: string }[])
    .map(r => r.channel_id);
}
