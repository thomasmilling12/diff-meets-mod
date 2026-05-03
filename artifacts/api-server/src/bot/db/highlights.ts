import { db } from "./database";

export interface Highlight {
  id: number;
  guild_id: string;
  user_id: string;
  keyword: string;
}

export function addHighlight(guildId: string, userId: string, keyword: string): boolean {
  try {
    db.prepare("INSERT INTO highlights (guild_id, user_id, keyword) VALUES (?, ?, ?)").run(guildId, userId, keyword.toLowerCase());
    return true;
  } catch { return false; }
}

export function removeHighlight(guildId: string, userId: string, keyword: string): boolean {
  const r = db.prepare("DELETE FROM highlights WHERE guild_id = ? AND user_id = ? AND keyword = ?").run(guildId, userId, keyword.toLowerCase());
  return (r.changes as number) > 0;
}

export function getUserHighlights(guildId: string, userId: string): Highlight[] {
  return db.prepare("SELECT * FROM highlights WHERE guild_id = ? AND user_id = ?").all(guildId, userId) as unknown as Highlight[];
}

export function clearUserHighlights(guildId: string, userId: string): void {
  db.prepare("DELETE FROM highlights WHERE guild_id = ? AND user_id = ?").run(guildId, userId);
}

export function getGuildHighlights(guildId: string): Highlight[] {
  return db.prepare("SELECT * FROM highlights WHERE guild_id = ?").all(guildId) as unknown as Highlight[];
}
