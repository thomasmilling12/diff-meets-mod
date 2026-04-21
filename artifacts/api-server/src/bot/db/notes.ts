import { db } from "./database";

export interface Note {
  id: number;
  guild_id: string;
  user_id: string;
  user_tag: string;
  note: string;
  moderator_tag: string;
  created_at: number;
}

export function addNote(guildId: string, userId: string, userTag: string, note: string, moderatorTag: string): void {
  db.prepare(
    "INSERT INTO notes (guild_id, user_id, user_tag, note, moderator_tag) VALUES (?, ?, ?, ?, ?)"
  ).run(guildId, userId, userTag, note, moderatorTag);
}

export function getNotes(guildId: string, userId: string): Note[] {
  return db.prepare("SELECT * FROM notes WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC")
    .all(guildId, userId) as unknown as Note[];
}

export function deleteNote(id: number, guildId: string): boolean {
  const result = db.prepare("DELETE FROM notes WHERE id = ? AND guild_id = ?").run(id, guildId);
  return (result.changes as number) > 0;
}
