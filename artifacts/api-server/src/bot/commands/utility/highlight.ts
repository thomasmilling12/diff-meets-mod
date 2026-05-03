import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { addHighlight, removeHighlight, getUserHighlights, clearUserHighlights } from "../../db/highlights";

const MAX_HIGHLIGHTS = 10;

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("highlight")
    .setDescription("Get a DM when a keyword is mentioned in any channel")
    .addSubcommand(s => s.setName("add").setDescription("Add a keyword to highlight")
      .addStringOption(o => o.setName("keyword").setDescription("Word or phrase to watch for (case-insensitive)").setRequired(true).setMaxLength(50)))
    .addSubcommand(s => s.setName("remove").setDescription("Remove a highlight keyword")
      .addStringOption(o => o.setName("keyword").setDescription("Keyword to remove").setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("List your highlight keywords"))
    .addSubcommand(s => s.setName("clear").setDescription("Remove all your highlight keywords")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;
    const userId = interaction.user.id;

    if (sub === "add") {
      const keyword = interaction.options.getString("keyword", true).toLowerCase().trim();
      const existing = getUserHighlights(guildId, userId);
      if (existing.length >= MAX_HIGHLIGHTS) {
        await interaction.reply({ content: `You can have at most **${MAX_HIGHLIGHTS}** highlights. Remove one first.`, ephemeral: true });
        return;
      }
      const added = addHighlight(guildId, userId, keyword);
      await interaction.reply({ content: added ? `✅ Highlight added: \`${keyword}\`\nYou'll get a DM whenever someone says it in this server.` : `You already have that keyword highlighted.`, ephemeral: true });

    } else if (sub === "remove") {
      const keyword = interaction.options.getString("keyword", true).toLowerCase().trim();
      const removed = removeHighlight(guildId, userId, keyword);
      await interaction.reply({ content: removed ? `Removed highlight: \`${keyword}\`` : `Keyword \`${keyword}\` not found in your highlights.`, ephemeral: true });

    } else if (sub === "list") {
      const highlights = getUserHighlights(guildId, userId);
      if (highlights.length === 0) {
        await interaction.reply({ content: "You have no highlights set. Use `/highlight add <keyword>` to add one.", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Your Highlights")
        .setDescription(highlights.map(h => `• \`${h.keyword}\``).join("\n"))
        .setFooter({ text: `${highlights.length}/${MAX_HIGHLIGHTS} slots used` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else {
      clearUserHighlights(guildId, userId);
      await interaction.reply({ content: "All your highlights have been cleared.", ephemeral: true });
    }
  },
};

export default command;
