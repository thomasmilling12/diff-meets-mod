import { db } from "./database";

export interface AutoThreadChannel {
  guild_id: string;
  channel_id: string;
  thread_name_format: string;
  archive_hours: number;
}

export function addAutoThreadChannel(guildId: string, channelId: string, format: string, archiveHours: number): void {
  db.prepare("INSERT OR REPLACE INTO auto_thread_channels (guild_id, channel_id, thread_name_format, archive_hours) VALUES (?, ?, ?, ?)")
    .run(guildId, channelId, format, archiveHours);
}

export function removeAutoThreadChannel(guildId: string, channelId: string): boolean {
  const r = db.prepare("DELETE FROM auto_thread_channels WHERE guild_id = ? AND channel_id = ?").run(guildId, channelId);
  return (r.changes as number) > 0;
}

export function getAutoThreadChannels(guildId: string): AutoThreadChannel[] {
  return db.prepare("SELECT * FROM auto_thread_channels WHERE guild_id = ?").all(guildId) as unknown as AutoThreadChannel[];
}

export function isAutoThreadChannel(guildId: string, channelId: string): AutoThreadChannel | null {
  return (db.prepare("SELECT * FROM auto_thread_channels WHERE guild_id = ? AND channel_id = ?")
    .get(guildId, channelId) as unknown as AutoThreadChannel) ?? null;
}
