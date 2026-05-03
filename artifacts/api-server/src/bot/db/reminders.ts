import { db } from "./database";

export interface Reminder {
  id: number;
  user_id: string;
  channel_id: string;
  guild_id: string | null;
  message: string;
  remind_at: number;
  created_at: number;
  sent: number;
}

export function createReminder(userId: string, channelId: string, guildId: string | null, message: string, remindAt: number): number {
  const r = db.prepare(
    "INSERT INTO reminders (user_id, channel_id, guild_id, message, remind_at) VALUES (?, ?, ?, ?, ?)"
  ).run(userId, channelId, guildId, message, remindAt);
  return r.lastInsertRowid as number;
}

export function getDueReminders(): Reminder[] {
  return db.prepare("SELECT * FROM reminders WHERE sent = 0 AND remind_at <= ?")
    .all(Math.floor(Date.now() / 1000)) as unknown as Reminder[];
}

export function markReminderSent(id: number): void {
  db.prepare("UPDATE reminders SET sent = 1 WHERE id = ?").run(id);
}

export function getUserReminders(userId: string): Reminder[] {
  return db.prepare("SELECT * FROM reminders WHERE user_id = ? AND sent = 0 ORDER BY remind_at ASC")
    .all(userId) as unknown as Reminder[];
}

export function deleteReminder(id: number, userId: string): boolean {
  const r = db.prepare("DELETE FROM reminders WHERE id = ? AND user_id = ?").run(id, userId);
  return (r.changes as number) > 0;
}
