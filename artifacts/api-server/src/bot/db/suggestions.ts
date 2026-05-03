import { db } from "./database";

export interface SuggestionConfig {
  guild_id: string;
  channel_id: string;
}

export interface Suggestion {
  id: number;
  guild_id: string;
  channel_id: string;
  message_id: string;
  user_id: string;
  content: string;
  status: "pending" | "approved" | "denied";
  response: string | null;
  created_at: number;
}

export function setSuggestionChannel(guildId: string, channelId: string): void {
  db.prepare("INSERT OR REPLACE INTO suggestion_channels (guild_id, channel_id) VALUES (?, ?)").run(guildId, channelId);
}

export function getSuggestionChannel(guildId: string): string | null {
  const r = db.prepare("SELECT channel_id FROM suggestion_channels WHERE guild_id = ?").get(guildId) as unknown as { channel_id: string } | undefined;
  return r?.channel_id ?? null;
}

export function createSuggestion(guildId: string, channelId: string, messageId: string, userId: string, content: string): number {
  const r = db.prepare("INSERT INTO suggestions (guild_id, channel_id, message_id, user_id, content) VALUES (?, ?, ?, ?, ?)").run(guildId, channelId, messageId, userId, content);
  return Number(r.lastInsertRowid);
}

export function getSuggestion(guildId: string, id: number): Suggestion | null {
  return (db.prepare("SELECT * FROM suggestions WHERE id = ? AND guild_id = ?").get(id, guildId) as unknown as Suggestion) ?? null;
}

export function updateSuggestionStatus(id: number, status: "approved" | "denied", response: string): void {
  db.prepare("UPDATE suggestions SET status = ?, response = ? WHERE id = ?").run(status, response, id);
}

export function listSuggestions(guildId: string, status?: string): Suggestion[] {
  if (status) return db.prepare("SELECT * FROM suggestions WHERE guild_id = ? AND status = ? ORDER BY created_at DESC LIMIT 20").all(guildId, status) as unknown as Suggestion[];
  return db.prepare("SELECT * FROM suggestions WHERE guild_id = ? ORDER BY created_at DESC LIMIT 20").all(guildId) as unknown as Suggestion[];
}
