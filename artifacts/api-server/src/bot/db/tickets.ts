import { db } from "./database";

export interface Ticket {
  id: number;
  guild_id: string;
  channel_id: string;
  user_id: string;
  user_tag: string;
  reason: string | null;
  status: string;
  created_at: number;
  closed_at: number | null;
  closed_by_tag: string | null;
}

export interface TicketConfig {
  guild_id: string;
  category_id: string | null;
  support_role_id: string | null;
  log_channel_id: string | null;
  max_open: number;
  panel_channel_id: string | null;
  panel_message_id: string | null;
}

function ensureConfig(guildId: string): void {
  db.prepare("INSERT OR IGNORE INTO ticket_config (guild_id) VALUES (?)").run(guildId);
}

export function getTicketConfig(guildId: string): TicketConfig {
  ensureConfig(guildId);
  return db.prepare("SELECT * FROM ticket_config WHERE guild_id = ?").get(guildId) as unknown as TicketConfig;
}

export function setTicketConfig(guildId: string, settings: Partial<Omit<TicketConfig, "guild_id">>): void {
  ensureConfig(guildId);
  for (const [col, val] of Object.entries(settings)) {
    if (val !== undefined) {
      db.prepare(`UPDATE ticket_config SET ${col} = ? WHERE guild_id = ?`).run(val, guildId);
    }
  }
}

export function createTicket(guildId: string, channelId: string, userId: string, userTag: string, reason?: string): number {
  const r = db.prepare(
    "INSERT INTO tickets (guild_id, channel_id, user_id, user_tag, reason) VALUES (?, ?, ?, ?, ?)"
  ).run(guildId, channelId, userId, userTag, reason ?? null);
  return r.lastInsertRowid as number;
}

export function closeTicket(ticketId: number, closedByTag: string): void {
  db.prepare("UPDATE tickets SET status = 'closed', closed_at = unixepoch(), closed_by_tag = ? WHERE id = ?")
    .run(closedByTag, ticketId);
}

export function getOpenTicketByUser(guildId: string, userId: string): Ticket | null {
  return (db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? AND status = 'open'")
    .get(guildId, userId) as unknown as Ticket) ?? null;
}

export function getTicketByChannel(channelId: string): Ticket | null {
  return (db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(channelId) as unknown as Ticket) ?? null;
}

export function getOpenTicketCount(guildId: string, userId: string): number {
  const r = db.prepare("SELECT COUNT(*) as cnt FROM tickets WHERE guild_id = ? AND user_id = ? AND status = 'open'")
    .get(guildId, userId) as unknown as { cnt: number };
  return r.cnt;
}
