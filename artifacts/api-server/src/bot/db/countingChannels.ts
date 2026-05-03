import { db } from "./database";

export interface CountingChannel {
  guild_id: string;
  channel_id: string;
  current_count: number;
  last_user_id: string | null;
  high_score: number;
  total_counts: number;
}

export function setupCounting(guildId: string, channelId: string, startAt = 0): void {
  db.prepare("INSERT OR REPLACE INTO counting_channels (guild_id, channel_id, current_count, last_user_id, high_score, total_counts) VALUES (?, ?, ?, NULL, 0, 0)")
    .run(guildId, channelId, startAt);
}

export function getCounting(guildId: string): CountingChannel | null {
  return (db.prepare("SELECT * FROM counting_channels WHERE guild_id = ?").get(guildId) as unknown as CountingChannel) ?? null;
}

export function getCountingByChannel(channelId: string): CountingChannel | null {
  return (db.prepare("SELECT * FROM counting_channels WHERE channel_id = ?").get(channelId) as unknown as CountingChannel) ?? null;
}

export function incrementCount(guildId: string, userId: string, newCount: number): void {
  db.prepare(`UPDATE counting_channels SET current_count = ?, last_user_id = ?, total_counts = total_counts + 1,
    high_score = CASE WHEN ? > high_score THEN ? ELSE high_score END WHERE guild_id = ?`)
    .run(newCount, userId, newCount, newCount, guildId);
}

export function resetCount(guildId: string): void {
  db.prepare("UPDATE counting_channels SET current_count = 0, last_user_id = NULL WHERE guild_id = ?").run(guildId);
}

export function disableCounting(guildId: string): boolean {
  const r = db.prepare("DELETE FROM counting_channels WHERE guild_id = ?").run(guildId);
  return (r.changes as number) > 0;
}
