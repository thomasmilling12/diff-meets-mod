import { Client, EmbedBuilder, TextChannel, User } from "discord.js";
import { getLogChannel } from "../db/guildConfig";

const ACTION_COLORS: Record<string, number> = {
  BAN: 0xff0000, UNBAN: 0x00ff00, TEMPBAN: 0xff4400,
  KICK: 0xff6600, MUTE: 0xffa500, UNMUTE: 0x00ff99,
  WARN: 0xffff00, LOCK: 0xff0000, UNLOCK: 0x00ff00,
  SLOWMODE: 0x5865f2, NOTE: 0x99aab5, WORD_FILTER: 0xff8800,
  PHISHING: 0xff0000,
};

export async function sendModLog(
  client: Client,
  guildId: string,
  action: string,
  target: User | string,
  moderatorTag: string,
  reason: string,
  extra?: Record<string, string>
): Promise<void> {
  const channelId = getLogChannel(guildId);
  if (!channelId) return;
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;
  const channel = guild.channels.cache.get(channelId) as TextChannel | undefined;
  if (!channel) return;

  const targetText = typeof target === "string" ? target : `${target.tag} (${target.id})`;

  const embed = new EmbedBuilder()
    .setColor(ACTION_COLORS[action] ?? 0x5865f2)
    .setTitle(`Mod Log: ${action}`)
    .addFields(
      { name: "Target", value: targetText, inline: true },
      { name: "Moderator", value: moderatorTag, inline: true },
      { name: "Reason", value: reason },
      ...(extra ? Object.entries(extra).map(([name, value]) => ({ name, value, inline: true })) : [])
    )
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(() => {});
}
