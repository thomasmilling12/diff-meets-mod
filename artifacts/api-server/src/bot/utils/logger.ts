import { ChatInputCommandInteraction, EmbedBuilder, TextChannel, User } from "discord.js";
import { getLogChannel } from "./guildConfig";

const actionColors: Record<string, number> = {
  BAN: 0xff0000,
  UNBAN: 0x00ff00,
  KICK: 0xff6600,
  MUTE: 0xffa500,
  UNMUTE: 0x00ff99,
  WARN: 0xffff00,
};

export async function logAction(
  interaction: ChatInputCommandInteraction,
  action: string,
  target: User,
  reason: string
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const channelId = getLogChannel(guildId);
  if (!channelId) return;

  const logChannel = interaction.guild?.channels.cache.get(channelId) as TextChannel | undefined;
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(actionColors[action] ?? 0x5865f2)
    .setTitle(`Mod Action: ${action}`)
    .addFields(
      { name: "Target", value: `${target.tag} (${target.id})`, inline: true },
      { name: "Moderator", value: `${interaction.user.tag}`, inline: true },
      { name: "Reason", value: reason },
    )
    .setTimestamp();

  try {
    await logChannel.send({ embeds: [embed] });
  } catch {
    // Channel may not be accessible
  }
}
