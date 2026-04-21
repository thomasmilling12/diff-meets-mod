import { db } from "./database";

export interface SelfRole {
  id: number;
  guild_id: string;
  role_id: string;
  description: string | null;
}

export function addSelfRole(guildId: string, roleId: string, description?: string): void {
  db.prepare("INSERT OR REPLACE INTO self_roles (guild_id, role_id, description) VALUES (?, ?, ?)")
    .run(guildId, roleId, description ?? null);
}

export function removeSelfRole(guildId: string, roleId: string): boolean {
  const result = db.prepare("DELETE FROM self_roles WHERE guild_id = ? AND role_id = ?").run(guildId, roleId);
  return (result.changes as number) > 0;
}

export function getSelfRoles(guildId: string): SelfRole[] {
  return db.prepare("SELECT * FROM self_roles WHERE guild_id = ? ORDER BY id")
    .all(guildId) as unknown as SelfRole[];
}

export function isSelfRole(guildId: string, roleId: string): boolean {
  const row = db.prepare("SELECT id FROM self_roles WHERE guild_id = ? AND role_id = ?").get(guildId, roleId);
  return row != null;
}
