import { db } from "./database";

export function setQuarantineRole(guildId: string, roleId: string): void {
  db.prepare("INSERT OR REPLACE INTO quarantine_config (guild_id, role_id) VALUES (?, ?)").run(guildId, roleId);
}

export function getQuarantineRole(guildId: string): string | null {
  const row = db.prepare("SELECT role_id FROM quarantine_config WHERE guild_id = ?").get(guildId) as unknown as { role_id: string } | undefined;
  return row?.role_id ?? null;
}

export function addQuarantinedUser(guildId: string, userId: string, reason: string, moderatorTag: string): void {
  db.prepare("INSERT OR REPLACE INTO quarantined_users (guild_id, user_id, reason, moderator_tag) VALUES (?, ?, ?, ?)").run(guildId, userId, reason, moderatorTag);
}

export function removeQuarantinedUser(guildId: string, userId: string): boolean {
  const r = db.prepare("DELETE FROM quarantined_users WHERE guild_id = ? AND user_id = ?").run(guildId, userId);
  return (r.changes as number) > 0;
}

export function isQuarantined(guildId: string, userId: string): boolean {
  return !!(db.prepare("SELECT 1 FROM quarantined_users WHERE guild_id = ? AND user_id = ?").get(guildId, userId));
}
