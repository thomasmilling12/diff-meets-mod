import { Client, ChannelType } from "discord.js";
import { getAllStatsChannels } from "../db/statsChannels";
import { botLogger } from "../logger";

function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

async function updateAll(client: Client): Promise<void> {
  const channels = getAllStatsChannels();
  for (const sc of channels) {
    try {
      const guild = client.guilds.cache.get(sc.guild_id);
      if (!guild) continue;

      await guild.members.fetch().catch(() => {});

      let value = 0;
      switch (sc.type) {
        case "members":  value = guild.memberCount; break;
        case "online":   value = guild.members.cache.filter(m => m.presence?.status !== "offline" && !!m.presence).size; break;
        case "bots":     value = guild.members.cache.filter(m => m.user.bot).size; break;
        case "channels": value = guild.channels.cache.filter(c => c.type !== ChannelType.GuildCategory).size; break;
        case "boosts":   value = guild.premiumSubscriptionCount ?? 0; break;
        default: continue;
      }

      const name = sc.format.replace("{value}", formatCount(value));
      const channel = guild.channels.cache.get(sc.channel_id);
      if (channel && channel.name !== name) {
        await channel.setName(name).catch(() => {});
      }
    } catch (err) {
      botLogger.warn({ err, channelId: sc.channel_id }, "Failed to update stats channel");
    }
  }
}

export function startStatsUpdater(client: Client): void {
  setTimeout(() => {
    updateAll(client).catch(() => {});
    setInterval(() => updateAll(client).catch(() => {}), 10 * 60 * 1000);
  }, 30_000);
}
