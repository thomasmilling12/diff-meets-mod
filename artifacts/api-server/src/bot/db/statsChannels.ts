import { db } from "./database";

export interface StatsChannel {
  id: number;
  guild_id: string;
  channel_id: string;
  type: string;
  format: string;
}

export function addStatsChannel(guildId: string, channelId: string, type: string, format: string): void {
  db.prepare("INSERT OR REPLACE INTO stats_channels (guild_id, channel_id, type, format) VALUES (?, ?, ?, ?)")
    .run(guildId, channelId, type, format);
}

export function removeStatsChannel(guildId: string, type: string): boolean {
  const r = db.prepare("DELETE FROM stats_channels WHERE guild_id = ? AND type = ?").run(guildId, type);
  return (r.changes as number) > 0;
}

export function getStatsChannels(guildId: string): StatsChannel[] {
  return db.prepare("SELECT * FROM stats_channels WHERE guild_id = ?").all(guildId) as unknown as StatsChannel[];
}

export function getAllStatsChannels(): StatsChannel[] {
  return db.prepare("SELECT * FROM stats_channels").all() as unknown as StatsChannel[];
}

export function updateStatsChannelId(guildId: string, type: string, channelId: string): void {
  db.prepare("UPDATE stats_channels SET channel_id = ? WHERE guild_id = ? AND type = ?").run(channelId, guildId, type);
}
