import { db } from "./database";

export interface TempRole {
  id: number;
  guild_id: string;
  user_id: string;
  role_id: string;
  expires_at: number;
  removed: number;
  assigned_by_tag: string;
}

export function addTempRole(guildId: string, userId: string, roleId: string, expiresAt: number, assignedByTag: string): number {
  db.prepare("DELETE FROM temp_roles WHERE guild_id = ? AND user_id = ? AND role_id = ?").run(guildId, userId, roleId);
  const r = db.prepare("INSERT INTO temp_roles (guild_id, user_id, role_id, expires_at, assigned_by_tag) VALUES (?, ?, ?, ?, ?)")
    .run(guildId, userId, roleId, expiresAt, assignedByTag);
  return r.lastInsertRowid as number;
}

export function getDueTempRoles(): TempRole[] {
  return db.prepare("SELECT * FROM temp_roles WHERE removed = 0 AND expires_at <= ?")
    .all(Math.floor(Date.now() / 1000)) as unknown as TempRole[];
}

export function markTempRoleRemoved(id: number): void {
  db.prepare("UPDATE temp_roles SET removed = 1 WHERE id = ?").run(id);
}

export function getActiveTempRoles(guildId: string, userId: string): TempRole[] {
  return db.prepare("SELECT * FROM temp_roles WHERE guild_id = ? AND user_id = ? AND removed = 0 AND expires_at > ?")
    .all(guildId, userId, Math.floor(Date.now() / 1000)) as unknown as TempRole[];
}
