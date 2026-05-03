import { db } from "./database";

export interface BotPresence {
  id: number;
  activity_type: string;
  activity_text: string;
  status: string;
}

export function getPresence(): BotPresence | null {
  return (db.prepare("SELECT * FROM bot_presence WHERE id = 1").get() as unknown as BotPresence) ?? null;
}

export function setPresence(activityType: string, activityText: string, status: string): void {
  db.prepare("INSERT OR REPLACE INTO bot_presence (id, activity_type, activity_text, status) VALUES (1, ?, ?, ?)")
    .run(activityType, activityText, status);
}

export function clearPresence(): void {
  db.prepare("DELETE FROM bot_presence WHERE id = 1").run();
}
