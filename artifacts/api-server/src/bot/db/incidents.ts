import { db } from "./database";

export interface Incident {
  id: number;
  guild_id: string;
  user_id: string;
  user_tag: string;
  type: string;
  details: string;
  staff_id: string;
  staff_tag: string;
  created_at: number;
}

export function addIncident(
  guildId: string,
  userId: string,
  userTag: string,
  type: string,
  details: string,
  staffId: string,
  staffTag: string,
): number {
  const r = db.prepare(
    "INSERT INTO incidents (guild_id, user_id, user_tag, type, details, staff_id, staff_tag) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(guildId, userId, userTag, type, details, staffId, staffTag);
  return r.lastInsertRowid as number;
}

export function getIncidentsForUser(guildId: string, userId: string): Incident[] {
  return db.prepare(
    "SELECT * FROM incidents WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC",
  ).all(guildId, userId) as unknown as Incident[];
}

export function getRecentIncidents(guildId: string, limit: number): Incident[] {
  return db.prepare(
    "SELECT * FROM incidents WHERE guild_id = ? ORDER BY created_at DESC LIMIT ?",
  ).all(guildId, limit) as unknown as Incident[];
}

export function getIncidentsByType(guildId: string, type: string, limit: number): Incident[] {
  return db.prepare(
    "SELECT * FROM incidents WHERE guild_id = ? AND type = ? ORDER BY created_at DESC LIMIT ?",
  ).all(guildId, type, limit) as unknown as Incident[];
}

export function removeIncidentById(guildId: string, id: number): boolean {
  const r = db.prepare("DELETE FROM incidents WHERE id = ? AND guild_id = ?").run(id, guildId);
  return (r.changes as number) > 0;
}

export interface OffenderRow {
  user_id: string;
  user_tag: string;
  count: number;
}

export function getTopOffenders(guildId: string, limit: number): OffenderRow[] {
  return db.prepare(
    `SELECT user_id, user_tag, COUNT(*) as count FROM incidents
     WHERE guild_id = ? GROUP BY user_id ORDER BY count DESC LIMIT ?`,
  ).all(guildId, limit) as unknown as OffenderRow[];
}
