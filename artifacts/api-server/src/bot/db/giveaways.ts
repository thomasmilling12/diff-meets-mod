import { db } from "./database";

export interface Giveaway {
  id: number;
  guild_id: string;
  channel_id: string;
  message_id: string | null;
  prize: string;
  winner_count: number;
  host_id: string;
  host_tag: string;
  ends_at: number;
  ended: number;
  winners: string | null;
}

export function createGiveaway(data: {
  guildId: string; channelId: string; prize: string; winnerCount: number;
  hostId: string; hostTag: string; endsAt: number;
}): number {
  const r = db.prepare(
    "INSERT INTO giveaways (guild_id, channel_id, prize, winner_count, host_id, host_tag, ends_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(data.guildId, data.channelId, data.prize, data.winnerCount, data.hostId, data.hostTag, data.endsAt);
  return r.lastInsertRowid as number;
}

export function setGiveawayMessageId(id: number, messageId: string): void {
  db.prepare("UPDATE giveaways SET message_id = ? WHERE id = ?").run(messageId, id);
}

export function getActiveGiveaways(): Giveaway[] {
  return db.prepare("SELECT * FROM giveaways WHERE ended = 0").all() as unknown as Giveaway[];
}

export function getActiveGiveawaysByGuild(guildId: string): Giveaway[] {
  return db.prepare("SELECT * FROM giveaways WHERE guild_id = ? AND ended = 0").all(guildId) as unknown as Giveaway[];
}

export function getGiveawayByMessage(messageId: string): Giveaway | null {
  return (db.prepare("SELECT * FROM giveaways WHERE message_id = ?").get(messageId) as unknown as Giveaway) ?? null;
}

export function endGiveaway(id: number, winners: string[]): void {
  db.prepare("UPDATE giveaways SET ended = 1, winners = ? WHERE id = ?").run(JSON.stringify(winners), id);
}

export function getExpiredGiveaways(): Giveaway[] {
  return db.prepare("SELECT * FROM giveaways WHERE ended = 0 AND ends_at <= ?")
    .all(Math.floor(Date.now() / 1000)) as unknown as Giveaway[];
}
