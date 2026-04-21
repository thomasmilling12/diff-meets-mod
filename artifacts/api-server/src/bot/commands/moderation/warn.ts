import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { logAction } from "../../utils/logger";
import { getWarnings, addWarning } from "../../utils/warnings";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("The user to warn").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("Reason for the warning").setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);

    const guildId = interaction.guildId!;
    addWarning(guildId, target.id, reason, interaction.user.tag);
    const warnings = getWarnings(guildId, target.id);

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle("Warning Issued")
      .addFields(
        { name: "User", value: `${target.tag} (${target.id})`, inline: true },
        { name: "Moderator", value: interaction.user.tag, inline: true },
        { name: "Reason", value: reason },
        { name: "Total Warnings", value: `${warnings.length}`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    await logAction(interaction, "WARN", target, reason);

    try {
      await target.send(`You have been warned in **${interaction.guild?.name}**.\nReason: ${reason}\nTotal warnings: ${warnings.length}`);
    } catch {
      // User has DMs disabled
    }
  },
};

export default command;
