import { db } from "./database";

export interface GuildConfig {
  guild_id: string;
  log_channel_id: string | null;
  welcome_channel_id: string | null;
  welcome_message: string | null;
  auto_role_id: string | null;
  automod_anti_spam: number;
  automod_anti_invite: number;
  automod_anti_caps: number;
  automod_anti_mention: number;
  automod_anti_links: number;
  automod_anti_phishing: number;
}

function ensureGuild(guildId: string): void {
  db.prepare("INSERT OR IGNORE INTO guild_config (guild_id) VALUES (?)").run(guildId);
}

export function getConfig(guildId: string): GuildConfig {
  ensureGuild(guildId);
  return db.prepare("SELECT * FROM guild_config WHERE guild_id = ?").get(guildId) as unknown as GuildConfig;
}

export function setLogChannel(guildId: string, channelId: string | null): void {
  ensureGuild(guildId);
  db.prepare("UPDATE guild_config SET log_channel_id = ? WHERE guild_id = ?").run(channelId, guildId);
}

export function getLogChannel(guildId: string): string | null {
  return getConfig(guildId).log_channel_id;
}

export function setWelcome(guildId: string, channelId: string, message: string): void {
  ensureGuild(guildId);
  db.prepare("UPDATE guild_config SET welcome_channel_id = ?, welcome_message = ? WHERE guild_id = ?")
    .run(channelId, message, guildId);
}

export function disableWelcome(guildId: string): void {
  ensureGuild(guildId);
  db.prepare("UPDATE guild_config SET welcome_channel_id = NULL, welcome_message = NULL WHERE guild_id = ?").run(guildId);
}

export function setAutoRole(guildId: string, roleId: string | null): void {
  ensureGuild(guildId);
  db.prepare("UPDATE guild_config SET auto_role_id = ? WHERE guild_id = ?").run(roleId, guildId);
}

export function setAutoMod(guildId: string, settings: Partial<{
  antiSpam: boolean; antiInvite: boolean; antiCaps: boolean;
  antiMention: boolean; antiLinks: boolean; antiPhishing: boolean;
}>): void {
  ensureGuild(guildId);
  const map: Record<string, string> = {
    antiSpam: "automod_anti_spam", antiInvite: "automod_anti_invite",
    antiCaps: "automod_anti_caps", antiMention: "automod_anti_mention",
    antiLinks: "automod_anti_links", antiPhishing: "automod_anti_phishing",
  };
  for (const [key, col] of Object.entries(map)) {
    const val = (settings as Record<string, boolean | undefined>)[key];
    if (val !== undefined) {
      db.prepare(`UPDATE guild_config SET ${col} = ? WHERE guild_id = ?`).run(val ? 1 : 0, guildId);
    }
  }
}
