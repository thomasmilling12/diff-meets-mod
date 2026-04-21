import { db } from "./database";

export interface Case {
  id: number;
  guild_id: string;
  case_number: number;
  action: string;
  user_id: string;
  user_tag: string;
  moderator_id: string;
  moderator_tag: string;
  reason: string;
  created_at: number;
  expires_at: number | null;
  active: number;
}

export function getNextCaseNumber(guildId: string): number {
  const row = db.prepare("SELECT MAX(case_number) as max FROM cases WHERE guild_id = ?").get(guildId) as unknown as { max: number | null };
  return (row.max ?? 0) + 1;
}

export function createCase(data: {
  guildId: string; action: string; userId: string; userTag: string;
  moderatorId: string; moderatorTag: string; reason: string; expiresAt?: number | null;
}): number {
  const caseNumber = getNextCaseNumber(data.guildId);
  db.prepare(
    `INSERT INTO cases (guild_id, case_number, action, user_id, user_tag, moderator_id, moderator_tag, reason, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(data.guildId, caseNumber, data.action, data.userId, data.userTag, data.moderatorId, data.moderatorTag, data.reason, data.expiresAt ?? null);
  return caseNumber;
}

export function getCase(guildId: string, caseNumber: number): Case | null {
  return (db.prepare("SELECT * FROM cases WHERE guild_id = ? AND case_number = ?").get(guildId, caseNumber) as unknown as Case) ?? null;
}

export function getCases(guildId: string, userId?: string, limit = 8, offset = 0): Case[] {
  if (userId) {
    return db.prepare("SELECT * FROM cases WHERE guild_id = ? AND user_id = ? ORDER BY case_number DESC LIMIT ? OFFSET ?")
      .all(guildId, userId, limit, offset) as unknown as Case[];
  }
  return db.prepare("SELECT * FROM cases WHERE guild_id = ? ORDER BY case_number DESC LIMIT ? OFFSET ?")
    .all(guildId, limit, offset) as unknown as Case[];
}

export function editCaseReason(guildId: string, caseNumber: number, reason: string): void {
  db.prepare("UPDATE cases SET reason = ? WHERE guild_id = ? AND case_number = ?").run(reason, guildId, caseNumber);
}

export function getExpiredTempBans(): Case[] {
  return db.prepare(
    "SELECT * FROM cases WHERE action = 'TEMPBAN' AND active = 1 AND expires_at IS NOT NULL AND expires_at <= ?"
  ).all(Math.floor(Date.now() / 1000)) as unknown as Case[];
}

export function deactivateCase(guildId: string, caseNumber: number): void {
  db.prepare("UPDATE cases SET active = 0 WHERE guild_id = ? AND case_number = ?").run(guildId, caseNumber);
}
