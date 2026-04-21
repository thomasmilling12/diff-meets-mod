import { db } from "./database";

export interface VerificationConfig {
  guild_id: string;
  channel_id: string | null;
  message_id: string | null;
  role_id: string | null;
  welcome_text: string;
}

function ensureConfig(guildId: string): void {
  db.prepare("INSERT OR IGNORE INTO verification_config (guild_id) VALUES (?)").run(guildId);
}

export function getVerificationConfig(guildId: string): VerificationConfig {
  ensureConfig(guildId);
  return db.prepare("SELECT * FROM verification_config WHERE guild_id = ?")
    .get(guildId) as unknown as VerificationConfig;
}

export function setVerificationConfig(guildId: string, settings: Partial<Omit<VerificationConfig, "guild_id">>): void {
  ensureConfig(guildId);
  for (const [col, val] of Object.entries(settings)) {
    if (val !== undefined) {
      db.prepare(`UPDATE verification_config SET ${col} = ? WHERE guild_id = ?`).run(val, guildId);
    }
  }
}
