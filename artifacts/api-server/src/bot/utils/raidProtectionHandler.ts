import { Guild, TextChannel, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { getRaidConfig } from "../db/raidProtection";
import { getLogChannel } from "../db/guildConfig";
import { botLogger } from "../logger";

const joinTimestamps: Map<string, number[]> = new Map();
const raidLocked: Set<string> = new Set();

export async function checkRaid(member: { guild: Guild; id: string }): Promise<boolean> {
  const guildId = member.guild.id;
  const config = getRaidConfig(guildId);

  if (!config.enabled) return false;

  const now = Date.now();
  const windowMs = config.time_window * 1000;
  const timestamps = (joinTimestamps.get(guildId) ?? []).filter(t => now - t < windowMs);
  timestamps.push(now);
  joinTimestamps.set(guildId, timestamps);

  if (timestamps.length < config.join_threshold) return false;
  if (raidLocked.has(guildId)) return true;

  raidLocked.add(guildId);
  botLogger.warn({ guildId, joins: timestamps.length }, "Raid detected — triggering lockdown");

  const guild = member.guild;
  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle("🚨 Raid Detected — Auto-Lockdown")
    .setDescription(`**${timestamps.length}** members joined in **${config.time_window}s**.\nAll channels have been locked.`)
    .setTimestamp();

  try {
    if (config.action === "LOCK" || config.action === "KICK") {
      for (const channel of guild.channels.cache.values()) {
        if (channel.isTextBased() && "permissionOverwrites" in channel) {
          await channel.permissionOverwrites.edit(guild.roles.everyone, {
            [PermissionFlagsBits.SendMessages.toString()]: false,
          }).catch(() => {});
        }
      }
    }

    const logChannelId = getLogChannel(guildId);
    if (logChannelId) {
      const logChannel = guild.channels.cache.get(logChannelId) as TextChannel | undefined;
      await logChannel?.send({ embeds: [embed] }).catch(() => {});
    }

    if (config.auto_unlock_minutes > 0) {
      setTimeout(async () => {
        raidLocked.delete(guildId);
        joinTimestamps.delete(guildId);
        for (const channel of guild.channels.cache.values()) {
          if (channel.isTextBased() && "permissionOverwrites" in channel) {
            await channel.permissionOverwrites.edit(guild.roles.everyone, {
              [PermissionFlagsBits.SendMessages.toString()]: null,
            }).catch(() => {});
          }
        }
        const logChannelId2 = getLogChannel(guildId);
        if (logChannelId2) {
          const logCh = guild.channels.cache.get(logChannelId2) as TextChannel | undefined;
          await logCh?.send({ embeds: [new EmbedBuilder().setColor(0x00cc66).setTitle("✅ Raid Lockdown Lifted").setDescription("Channels have been automatically unlocked.").setTimestamp()] }).catch(() => {});
        }
      }, config.auto_unlock_minutes * 60 * 1000);
    }
  } catch (err) {
    botLogger.error({ err }, "Failed to execute raid lockdown");
  }

  return true;
}

export function isRaidLocked(guildId: string): boolean {
  return raidLocked.has(guildId);
}

export function manualUnlock(guildId: string): void {
  raidLocked.delete(guildId);
  joinTimestamps.delete(guildId);
}
