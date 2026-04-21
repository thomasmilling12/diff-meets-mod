import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { addWarning, getWarnings } from "../../db/warnings";
import { createCase } from "../../db/cases";
import { sendModLog } from "../../utils/modLog";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName("user").setDescription("The user to warn").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason for the warning").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);
    const guildId = interaction.guildId!;

    addWarning(guildId, target.id, target.tag, reason, interaction.user.tag);
    const warnings = getWarnings(guildId, target.id);

    const caseNum = createCase({
      guildId, action: "WARN", userId: target.id, userTag: target.tag,
      moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, reason,
    });

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle("Warning Issued")
      .addFields(
        { name: "User", value: `${target.tag} (${target.id})`, inline: true },
        { name: "Moderator", value: interaction.user.tag, inline: true },
        { name: "Reason", value: reason },
        { name: "Total Warnings", value: `${warnings.length}`, inline: true },
        { name: "Case", value: `#${caseNum}`, inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    await sendModLog(interaction.client, guildId, "WARN", target, interaction.user.tag, reason);

    try {
      await target.send(`You have been **warned** in **${interaction.guild?.name}**.\nReason: ${reason}\nTotal warnings: ${warnings.length}`);
    } catch {}
  },
};

export default command;
