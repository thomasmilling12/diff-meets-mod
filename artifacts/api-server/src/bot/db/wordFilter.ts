import { db } from "./database";

export function addWord(guildId: string, word: string): void {
  db.prepare("INSERT OR IGNORE INTO word_filter (guild_id, word) VALUES (?, ?)").run(guildId, word.toLowerCase());
}

export function removeWord(guildId: string, word: string): boolean {
  const result = db.prepare("DELETE FROM word_filter WHERE guild_id = ? AND word = ?").run(guildId, word.toLowerCase());
  return (result.changes as number) > 0;
}

export function getWords(guildId: string): string[] {
  return (db.prepare("SELECT word FROM word_filter WHERE guild_id = ?").all(guildId) as unknown as { word: string }[]).map(r => r.word);
}

export function containsFilteredWord(guildId: string, content: string): string | null {
  const words = getWords(guildId);
  const lower = content.toLowerCase();
  for (const word of words) {
    if (lower.includes(word)) return word;
  }
  return null;
}
