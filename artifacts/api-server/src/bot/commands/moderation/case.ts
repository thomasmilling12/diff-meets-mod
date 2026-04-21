import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { getCase, getCases, editCaseReason } from "../../db/cases";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("case")
    .setDescription("View or edit moderation cases")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(s => s.setName("view").setDescription("View a specific case")
      .addIntegerOption(o => o.setName("number").setDescription("Case number").setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("List recent cases")
      .addUserOption(o => o.setName("user").setDescription("Filter by user").setRequired(false))
      .addIntegerOption(o => o.setName("page").setDescription("Page number").setMinValue(1).setRequired(false)))
    .addSubcommand(s => s.setName("edit").setDescription("Edit a case reason")
      .addIntegerOption(o => o.setName("number").setDescription("Case number to edit").setRequired(true))
      .addStringOption(o => o.setName("reason").setDescription("New reason").setRequired(true))),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "view") {
      const num = interaction.options.getInteger("number", true);
      const c = getCase(guildId, num);
      if (!c) {
        await interaction.reply({ content: `Case #${num} not found.`, ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`Case #${c.case_number}: ${c.action}`)
        .addFields(
          { name: "User", value: `${c.user_tag} (${c.user_id})`, inline: true },
          { name: "Moderator", value: c.moderator_tag, inline: true },
          { name: "Reason", value: c.reason },
          { name: "Date", value: `<t:${c.created_at}:F>`, inline: true },
          ...(c.expires_at ? [{ name: "Expires", value: `<t:${c.expires_at}:R>`, inline: true }] : []),
          { name: "Active", value: c.active ? "Yes" : "No", inline: true },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });

    } else if (sub === "edit") {
      const num = interaction.options.getInteger("number", true);
      const newReason = interaction.options.getString("reason", true);
      const c = getCase(guildId, num);
      if (!c) {
        await interaction.reply({ content: `Case #${num} not found.`, ephemeral: true });
        return;
      }
      editCaseReason(guildId, num, newReason);
      await interaction.reply({ content: `Case #${num} reason updated to: ${newReason}` });

    } else {
      const user = interaction.options.getUser("user");
      const page = (interaction.options.getInteger("page") ?? 1) - 1;
      const PAGE_SIZE = 8;
      const allCases = getCases(guildId, user?.id, PAGE_SIZE, page * PAGE_SIZE);
      if (allCases.length === 0) {
        await interaction.reply({ content: page > 0 ? `No cases on page ${page + 1}.` : "No cases found.", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(user ? `Cases for ${user.tag}` : "Recent Cases")
        .setDescription(allCases.map(c =>
          `**#${c.case_number}** [${c.action}] ${c.user_tag} — ${c.reason}\n  By ${c.moderator_tag} <t:${c.created_at}:R>`
        ).join("\n\n"))
        .setFooter({ text: `Page ${page + 1} • Showing ${allCases.length} case(s)` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
