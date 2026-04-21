interface AutoModConfig {
  antiSpam: boolean;
  antiInvite: boolean;
  antiCaps: boolean;
  antiMention: boolean;
  antiLinks: boolean;
}

interface GuildConfig {
  logChannelId?: string;
  autoMod: AutoModConfig;
}

const defaultAutoMod: AutoModConfig = {
  antiSpam: false,
  antiInvite: false,
  antiCaps: false,
  antiMention: false,
  antiLinks: false,
};

const guildConfigs: Map<string, GuildConfig> = new Map();

function getConfig(guildId: string): GuildConfig {
  if (!guildConfigs.has(guildId)) {
    guildConfigs.set(guildId, { autoMod: { ...defaultAutoMod } });
  }
  return guildConfigs.get(guildId)!;
}

export function setLogChannel(guildId: string, channelId: string): void {
  const config = getConfig(guildId);
  config.logChannelId = channelId;
}

export function disableLog(guildId: string): void {
  const config = getConfig(guildId);
  config.logChannelId = undefined;
}

export function getLogChannel(guildId: string): string | undefined {
  return getConfig(guildId).logChannelId;
}

export function getAutoModConfig(guildId: string): AutoModConfig {
  return getConfig(guildId).autoMod;
}

export function setAutoModConfig(guildId: string, autoMod: Partial<AutoModConfig>): void {
  const config = getConfig(guildId);
  config.autoMod = { ...config.autoMod, ...autoMod };
}
