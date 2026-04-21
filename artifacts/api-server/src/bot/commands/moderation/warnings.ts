import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { getWarnings, clearWarnings, removeWarningById } from "../../db/warnings";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("View, remove, or clear warnings for a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(s => s.setName("list").setDescription("List warnings for a user")
      .addUserOption(o => o.setName("user").setDescription("The user to check").setRequired(true))
      .addIntegerOption(o => o.setName("page").setDescription("Page number").setMinValue(1).setRequired(false)))
    .addSubcommand(s => s.setName("remove").setDescription("Remove a specific warning by ID")
      .addUserOption(o => o.setName("user").setDescription("The user").setRequired(true))
      .addIntegerOption(o => o.setName("id").setDescription("Warning ID to remove (shown in /warnings list)").setRequired(true)))
    .addSubcommand(s => s.setName("clear").setDescription("Clear all warnings for a user")
      .addUserOption(o => o.setName("user").setDescription("The user to clear warnings for").setRequired(true))),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser("user", true);
    const guildId = interaction.guildId!;

    if (sub === "clear") {
      clearWarnings(guildId, target.id);
      await interaction.reply({ content: `Cleared all warnings for **${target.tag}**.` });
    } else if (sub === "remove") {
      const id = interaction.options.getInteger("id", true);
      const removed = removeWarningById(guildId, target.id, id);
      await interaction.reply({
        content: removed ? `Removed warning ID **${id}** for **${target.tag}**.` : `Warning ID **${id}** not found for that user.`,
        ephemeral: !removed,
      });
    } else {
      const page = (interaction.options.getInteger("page") ?? 1) - 1;
      const PAGE_SIZE = 8;
      const allWarnings = getWarnings(guildId, target.id);

      if (allWarnings.length === 0) {
        await interaction.reply({ content: `**${target.tag}** has no warnings.` });
        return;
      }

      const start = page * PAGE_SIZE;
      const slice = allWarnings.slice(start, start + PAGE_SIZE);
      if (slice.length === 0) {
        await interaction.reply({ content: `No warnings on page ${page + 1}.`, ephemeral: true });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle(`Warnings for ${target.tag}`)
        .setDescription(
          slice.map(w => `**ID ${w.id}** — ${w.reason}\n  By: ${w.moderator_tag} — <t:${w.created_at}:R>`).join("\n\n")
        )
        .setFooter({ text: `Page ${page + 1} of ${Math.ceil(allWarnings.length / PAGE_SIZE)} • Total: ${allWarnings.length}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
