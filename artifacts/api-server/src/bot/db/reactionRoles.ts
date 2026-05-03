import { db } from "./database";

export interface ReactionRole {
  id: number;
  guild_id: string;
  channel_id: string;
  message_id: string;
  emoji: string;
  role_id: string;
}

export function addReactionRole(guildId: string, channelId: string, messageId: string, emoji: string, roleId: string): void {
  db.prepare("INSERT OR REPLACE INTO reaction_roles (guild_id, channel_id, message_id, emoji, role_id) VALUES (?, ?, ?, ?, ?)")
    .run(guildId, channelId, messageId, emoji, roleId);
}

export function removeReactionRole(guildId: string, messageId: string, emoji: string): boolean {
  const r = db.prepare("DELETE FROM reaction_roles WHERE guild_id = ? AND message_id = ? AND emoji = ?")
    .run(guildId, messageId, emoji);
  return (r.changes as number) > 0;
}

export function getReactionRole(guildId: string, messageId: string, emoji: string): ReactionRole | null {
  return (db.prepare("SELECT * FROM reaction_roles WHERE guild_id = ? AND message_id = ? AND emoji = ?")
    .get(guildId, messageId, emoji) as unknown as ReactionRole) ?? null;
}

export function getReactionRolesByMessage(guildId: string, messageId: string): ReactionRole[] {
  return db.prepare("SELECT * FROM reaction_roles WHERE guild_id = ? AND message_id = ?")
    .all(guildId, messageId) as unknown as ReactionRole[];
}

export function getReactionRolesByGuild(guildId: string): ReactionRole[] {
  return db.prepare("SELECT * FROM reaction_roles WHERE guild_id = ?")
    .all(guildId) as unknown as ReactionRole[];
}
