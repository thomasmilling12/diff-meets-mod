import { db } from "./database";

export interface ScheduledAnnouncement {
  id: number;
  guild_id: string;
  channel_id: string;
  message: string;
  send_at: number;
  sent: number;
  created_by_tag: string;
}

export function createScheduledAnnouncement(guildId: string, channelId: string, message: string, sendAt: number, createdByTag: string): number {
  const r = db.prepare(
    "INSERT INTO scheduled_announcements (guild_id, channel_id, message, send_at, created_by_tag) VALUES (?, ?, ?, ?, ?)"
  ).run(guildId, channelId, message, sendAt, createdByTag);
  return r.lastInsertRowid as number;
}

export function getDueAnnouncements(): ScheduledAnnouncement[] {
  return db.prepare("SELECT * FROM scheduled_announcements WHERE sent = 0 AND send_at <= ?")
    .all(Math.floor(Date.now() / 1000)) as unknown as ScheduledAnnouncement[];
}

export function markAnnouncementSent(id: number): void {
  db.prepare("UPDATE scheduled_announcements SET sent = 1 WHERE id = ?").run(id);
}

export function getPendingAnnouncements(guildId: string): ScheduledAnnouncement[] {
  return db.prepare("SELECT * FROM scheduled_announcements WHERE guild_id = ? AND sent = 0 ORDER BY send_at ASC")
    .all(guildId) as unknown as ScheduledAnnouncement[];
}

export function deleteScheduledAnnouncement(id: number, guildId: string): boolean {
  const r = db.prepare("DELETE FROM scheduled_announcements WHERE id = ? AND guild_id = ?").run(id, guildId);
  return (r.changes as number) > 0;
}
