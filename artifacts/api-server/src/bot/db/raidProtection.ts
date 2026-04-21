import { db } from "./database";

export interface RaidConfig {
  guild_id: string;
  enabled: number;
  join_threshold: number;
  time_window: number;
  action: string;
  auto_unlock_minutes: number;
}

function ensureRaidConfig(guildId: string): void {
  db.prepare("INSERT OR IGNORE INTO raid_config (guild_id) VALUES (?)").run(guildId);
}

export function getRaidConfig(guildId: string): RaidConfig {
  ensureRaidConfig(guildId);
  return db.prepare("SELECT * FROM raid_config WHERE guild_id = ?").get(guildId) as unknown as RaidConfig;
}

export function setRaidConfig(guildId: string, settings: Partial<Omit<RaidConfig, "guild_id">>): void {
  ensureRaidConfig(guildId);
  for (const [col, val] of Object.entries(settings)) {
    if (val !== undefined) {
      db.prepare(`UPDATE raid_config SET ${col} = ? WHERE guild_id = ?`).run(val, guildId);
    }
  }
}
