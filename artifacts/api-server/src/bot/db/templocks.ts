import { db } from "./database";

export interface TempLock {
  guild_id: string;
  channel_id: string;
  unlock_at: number;
}

export function addTempLock(guildId: string, channelId: string, unlockAt: number): void {
  db.prepare("INSERT OR REPLACE INTO templocks (guild_id, channel_id, unlock_at) VALUES (?, ?, ?)").run(guildId, channelId, unlockAt);
}

export function removeTempLock(guildId: string, channelId: string): void {
  db.prepare("DELETE FROM templocks WHERE guild_id = ? AND channel_id = ?").run(guildId, channelId);
}

export function getExpiredTempLocks(): TempLock[] {
  return db.prepare("SELECT * FROM templocks WHERE unlock_at <= ?").all(Math.floor(Date.now() / 1000)) as unknown as TempLock[];
}

export function getAllTempLocks(): TempLock[] {
  return db.prepare("SELECT * FROM templocks").all() as unknown as TempLock[];
}
