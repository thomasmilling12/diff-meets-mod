import { db } from "./database";

export interface Tag {
  id: number;
  guild_id: string;
  name: string;
  content: string;
  author_id: string;
  created_at: number;
  uses: number;
}

export function createTag(guildId: string, name: string, content: string, authorId: string): boolean {
  try {
    db.prepare("INSERT INTO tags (guild_id, name, content, author_id) VALUES (?, ?, ?, ?)").run(guildId, name.toLowerCase(), content, authorId);
    return true;
  } catch { return false; }
}

export function getTag(guildId: string, name: string): Tag | null {
  return (db.prepare("SELECT * FROM tags WHERE guild_id = ? AND name = ?").get(guildId, name.toLowerCase()) as unknown as Tag) ?? null;
}

export function useTag(id: number): void {
  db.prepare("UPDATE tags SET uses = uses + 1 WHERE id = ?").run(id);
}

export function editTag(guildId: string, name: string, content: string): boolean {
  const r = db.prepare("UPDATE tags SET content = ? WHERE guild_id = ? AND name = ?").run(content, guildId, name.toLowerCase());
  return (r.changes as number) > 0;
}

export function deleteTag(guildId: string, name: string): boolean {
  const r = db.prepare("DELETE FROM tags WHERE guild_id = ? AND name = ?").run(guildId, name.toLowerCase());
  return (r.changes as number) > 0;
}

export function listTags(guildId: string, limit = 25, offset = 0): Tag[] {
  return db.prepare("SELECT * FROM tags WHERE guild_id = ? ORDER BY uses DESC LIMIT ? OFFSET ?").all(guildId, limit, offset) as unknown as Tag[];
}

export function countTags(guildId: string): number {
  return (db.prepare("SELECT COUNT(*) as c FROM tags WHERE guild_id = ?").get(guildId) as unknown as { c: number }).c;
}
