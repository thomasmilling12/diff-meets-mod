import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { getWarnings, clearWarnings } from "../../db/warnings";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("View or clear warnings for a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName("user").setDescription("The user to check").setRequired(true))
    .addBooleanOption(o => o.setName("clear").setDescription("Clear all warnings for this user").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const shouldClear = interaction.options.getBoolean("clear") ?? false;
    const guildId = interaction.guildId!;

    if (shouldClear) {
      clearWarnings(guildId, target.id);
      await interaction.reply({ content: `Cleared all warnings for **${target.tag}**.` });
      return;
    }

    const warnings = getWarnings(guildId, target.id);
    if (warnings.length === 0) {
      await interaction.reply({ content: `**${target.tag}** has no warnings.` });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle(`Warnings for ${target.tag}`)
      .setDescription(
        warnings.map((w, i) =>
          `**${i + 1}.** ${w.reason}\n  By: ${w.moderator_tag} — <t:${w.created_at}:R>`
        ).join("\n\n")
      )
      .setFooter({ text: `Total: ${warnings.length} warning(s)` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
