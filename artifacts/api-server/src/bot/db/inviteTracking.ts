import { db } from "./database";

export interface InviteTracking {
  guild_id: string;
  enabled: number;
  log_channel_id: string | null;
}

export interface InviteUse {
  id: number;
  guild_id: string;
  inviter_id: string;
  inviter_tag: string;
  invite_code: string;
  uses: number;
}

export interface MemberInvite {
  guild_id: string;
  user_id: string;
  invited_by_id: string | null;
  invite_code: string | null;
}

function ensureConfig(guildId: string): void {
  db.prepare("INSERT OR IGNORE INTO invite_tracking (guild_id) VALUES (?)").run(guildId);
}

export function getInviteTracking(guildId: string): InviteTracking {
  ensureConfig(guildId);
  return db.prepare("SELECT * FROM invite_tracking WHERE guild_id = ?").get(guildId) as unknown as InviteTracking;
}

export function setInviteTracking(guildId: string, settings: Partial<Omit<InviteTracking, "guild_id">>): void {
  ensureConfig(guildId);
  for (const [col, val] of Object.entries(settings)) {
    if (val !== undefined) db.prepare(`UPDATE invite_tracking SET ${col} = ? WHERE guild_id = ?`).run(val, guildId);
  }
}

export function upsertInviteUse(guildId: string, inviterId: string, inviterTag: string, code: string, uses: number): void {
  db.prepare("INSERT OR REPLACE INTO invite_uses (guild_id, inviter_id, inviter_tag, invite_code, uses) VALUES (?, ?, ?, ?, ?)")
    .run(guildId, inviterId, inviterTag, code, uses);
}

export function getInviteUse(guildId: string, code: string): InviteUse | null {
  return (db.prepare("SELECT * FROM invite_uses WHERE guild_id = ? AND invite_code = ?")
    .get(guildId, code) as unknown as InviteUse) ?? null;
}

export function setMemberInvite(guildId: string, userId: string, invitedById: string | null, code: string | null): void {
  db.prepare("INSERT OR REPLACE INTO member_invites (guild_id, user_id, invited_by_id, invite_code) VALUES (?, ?, ?, ?)")
    .run(guildId, userId, invitedById, code);
}

export function getMemberInvite(guildId: string, userId: string): MemberInvite | null {
  return (db.prepare("SELECT * FROM member_invites WHERE guild_id = ? AND user_id = ?")
    .get(guildId, userId) as unknown as MemberInvite) ?? null;
}

export function getTopInviters(guildId: string, limit = 10): InviteUse[] {
  return db.prepare("SELECT * FROM invite_uses WHERE guild_id = ? ORDER BY uses DESC LIMIT ?")
    .all(guildId, limit) as unknown as InviteUse[];
}
