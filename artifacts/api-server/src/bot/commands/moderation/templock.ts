import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, PermissionsBitField, ChannelType, TextChannel, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { addTempLock } from "../../db/templocks";

function parseDuration(raw: string): number | null {
  const match = raw.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  const u = match[2].toLowerCase();
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return n * multipliers[u];
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("templock")
    .setDescription("Lock a channel for a set duration, then auto-unlock it")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption(o => o.setName("duration").setDescription("Duration e.g. 30m, 2h, 1d").setRequired(true))
    .addChannelOption(o => o.setName("channel").setDescription("Channel to lock (default: current)").addChannelTypes(ChannelType.GuildText).setRequired(false))
    .addStringOption(o => o.setName("reason").setDescription("Reason for the temporary lock").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const rawDuration = interaction.options.getString("duration", true);
    const reason = interaction.options.getString("reason") ?? "Temporarily locked";
    const target = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel | null;

    if (!target || !(target instanceof TextChannel)) {
      await interaction.reply({ content: "This only works in text channels.", ephemeral: true });
      return;
    }

    const secs = parseDuration(rawDuration);
    if (!secs || secs < 10 || secs > 86400 * 7) {
      await interaction.reply({ content: "Invalid duration. Use format like `30m`, `2h`, `1d` (max 7 days).", ephemeral: true });
      return;
    }

    const everyoneRole = interaction.guild?.roles.everyone;
    if (!everyoneRole) return;

    await target.permissionOverwrites.edit(everyoneRole, { SendMessages: false }, { reason: `Templock: ${reason}` });

    const unlockAt = Math.floor(Date.now() / 1000) + secs;
    addTempLock(interaction.guildId!, target.id, unlockAt);

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xff8800)
        .setTitle("🔒 Channel Temporarily Locked")
        .addFields(
          { name: "Channel", value: `<#${target.id}>`, inline: true },
          { name: "Unlocks", value: `<t:${unlockAt}:R>`, inline: true },
          { name: "Reason", value: reason },
        ).setTimestamp()],
    });
  },
};

export default command;
