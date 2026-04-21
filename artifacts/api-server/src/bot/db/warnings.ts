import { db } from "./database";

export interface Warning {
  id: number;
  guild_id: string;
  user_id: string;
  user_tag: string;
  reason: string;
  moderator_tag: string;
  created_at: number;
}

export function addWarning(guildId: string, userId: string, userTag: string, reason: string, moderatorTag: string): void {
  db.prepare(
    "INSERT INTO warnings (guild_id, user_id, user_tag, reason, moderator_tag) VALUES (?, ?, ?, ?, ?)"
  ).run(guildId, userId, userTag, reason, moderatorTag);
}

export function getWarnings(guildId: string, userId: string): Warning[] {
  return db.prepare("SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC")
    .all(guildId, userId) as unknown as Warning[];
}

export function clearWarnings(guildId: string, userId: string): void {
  db.prepare("DELETE FROM warnings WHERE guild_id = ? AND user_id = ?").run(guildId, userId);
}

export function removeWarningById(guildId: string, userId: string, id: number): boolean {
  const r = db.prepare("DELETE FROM warnings WHERE id = ? AND guild_id = ? AND user_id = ?").run(id, guildId, userId);
  return (r.changes as number) > 0;
}
