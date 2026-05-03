import { db } from "./database";

export interface AfkUser {
  user_id: string;
  guild_id: string;
  reason: string;
  set_at: number;
}

export function setAfk(userId: string, guildId: string, reason: string): void {
  db.prepare("INSERT OR REPLACE INTO afk_users (user_id, guild_id, reason, set_at) VALUES (?, ?, ?, unixepoch())")
    .run(userId, guildId, reason);
}

export function clearAfk(userId: string, guildId: string): boolean {
  const r = db.prepare("DELETE FROM afk_users WHERE user_id = ? AND guild_id = ?").run(userId, guildId);
  return (r.changes as number) > 0;
}

export function getAfk(userId: string, guildId: string): AfkUser | null {
  return (db.prepare("SELECT * FROM afk_users WHERE user_id = ? AND guild_id = ?")
    .get(userId, guildId) as unknown as AfkUser) ?? null;
}
