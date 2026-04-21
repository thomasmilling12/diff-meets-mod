import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { getCase, getCases } from "../../db/cases";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("case")
    .setDescription("View moderation cases")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(s => s.setName("view").setDescription("View a specific case")
      .addIntegerOption(o => o.setName("number").setDescription("Case number").setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("List recent cases")
      .addUserOption(o => o.setName("user").setDescription("Filter by user").setRequired(false))),

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

    } else {
      const user = interaction.options.getUser("user");
      const cases = getCases(guildId, user?.id);
      if (cases.length === 0) {
        await interaction.reply({ content: "No cases found.", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(user ? `Cases for ${user.tag}` : "Recent Cases")
        .setDescription(cases.map(c =>
          `**#${c.case_number}** [${c.action}] ${c.user_tag} — ${c.reason}\n  By ${c.moderator_tag} <t:${c.created_at}:R>`
        ).join("\n\n"))
        .setFooter({ text: `Showing ${cases.length} case(s)` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
