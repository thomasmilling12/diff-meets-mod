import { db } from "./database";

export function enableDehoist(guildId: string): void {
  db.prepare("INSERT OR REPLACE INTO dehoist_config (guild_id, enabled) VALUES (?, 1)").run(guildId);
}

export function disableDehoist(guildId: string): void {
  db.prepare("INSERT OR REPLACE INTO dehoist_config (guild_id, enabled) VALUES (?, 0)").run(guildId);
}

export function isDehoistEnabled(guildId: string): boolean {
  const r = db.prepare("SELECT enabled FROM dehoist_config WHERE guild_id = ?").get(guildId) as unknown as { enabled: number } | undefined;
  return (r?.enabled ?? 0) === 1;
}

const HOIST_CHARS = /^[\x00-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]/;
export function isHoisted(name: string): boolean {
  return HOIST_CHARS.test(name);
}
