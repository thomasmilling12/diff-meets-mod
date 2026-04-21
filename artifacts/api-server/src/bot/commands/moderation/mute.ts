import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../client";
import { logAction } from "../../utils/logger";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Timeout (mute) a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("The user to mute").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("duration")
        .setDescription("Duration in minutes (1-40320)")
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("Reason for the mute").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const durationMinutes = interaction.options.getInteger("duration", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";

    const member = interaction.guild?.members.cache.get(target.id);
    if (!member) {
      await interaction.reply({ content: "Could not find that member in this server.", ephemeral: true });
      return;
    }

    if (!member.moderatable) {
      await interaction.reply({ content: "I cannot mute this user. They may have higher permissions.", ephemeral: true });
      return;
    }

    try {
      const durationMs = durationMinutes * 60 * 1000;
      await member.timeout(durationMs, `${reason} | Muted by ${interaction.user.tag}`);

      const hours = Math.floor(durationMinutes / 60);
      const mins = durationMinutes % 60;
      const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

      await interaction.reply({
        content: `Successfully muted **${target.tag}** for **${durationText}**.\nReason: ${reason}`,
      });

      await logAction(interaction, "MUTE", target, reason);
    } catch {
      await interaction.reply({ content: "Failed to mute the user.", ephemeral: true });
    }
  },
};

export default command;
