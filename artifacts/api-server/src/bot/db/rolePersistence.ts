import { db } from "./database";

export function saveRoles(guildId: string, userId: string, roleIds: string[]): void {
  if (roleIds.length === 0) return;
  db.prepare("INSERT OR REPLACE INTO role_persistence (guild_id, user_id, role_ids, saved_at) VALUES (?, ?, ?, unixepoch())")
    .run(guildId, userId, roleIds.join(","));
}

export function getSavedRoles(guildId: string, userId: string): string[] {
  const row = db.prepare("SELECT role_ids FROM role_persistence WHERE guild_id = ? AND user_id = ?")
    .get(guildId, userId) as unknown as { role_ids: string } | undefined;
  if (!row?.role_ids) return [];
  return row.role_ids.split(",").filter(Boolean);
}

export function clearSavedRoles(guildId: string, userId: string): void {
  db.prepare("DELETE FROM role_persistence WHERE guild_id = ? AND user_id = ?").run(guildId, userId);
}
