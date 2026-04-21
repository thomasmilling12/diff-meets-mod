import { db } from "./database";

export interface ButtonRole {
  id: number;
  guild_id: string;
  channel_id: string;
  message_id: string | null;
  role_id: string;
  label: string;
  emoji: string | null;
}

export function addButtonRole(guildId: string, channelId: string, roleId: string, label: string, emoji?: string): void {
  db.prepare(
    "INSERT OR REPLACE INTO button_roles (guild_id, channel_id, role_id, label, emoji) VALUES (?, ?, ?, ?, ?)"
  ).run(guildId, channelId, roleId, label, emoji ?? null);
}

export function removeButtonRole(guildId: string, roleId: string): boolean {
  const result = db.prepare("DELETE FROM button_roles WHERE guild_id = ? AND role_id = ?").run(guildId, roleId);
  return (result.changes as number) > 0;
}

export function getButtonRoles(guildId: string): ButtonRole[] {
  return db.prepare("SELECT * FROM button_roles WHERE guild_id = ?").all(guildId) as unknown as ButtonRole[];
}

export function setMessageId(guildId: string, channelId: string, messageId: string): void {
  db.prepare("UPDATE button_roles SET message_id = ? WHERE guild_id = ? AND channel_id = ?")
    .run(messageId, guildId, channelId);
}

export function findByMessageId(messageId: string): ButtonRole[] {
  return db.prepare("SELECT * FROM button_roles WHERE message_id = ?").all(messageId) as unknown as ButtonRole[];
}
