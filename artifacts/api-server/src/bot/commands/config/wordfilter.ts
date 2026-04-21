import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { addWord, removeWord, getWords } from "../../db/wordFilter";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("wordfilter")
    .setDescription("Manage the word/phrase filter")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("add").setDescription("Add a word or phrase to the filter")
      .addStringOption(o => o.setName("word").setDescription("Word or phrase to block").setRequired(true)))
    .addSubcommand(s => s.setName("remove").setDescription("Remove a word from the filter")
      .addStringOption(o => o.setName("word").setDescription("Word to remove").setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("Show all filtered words")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "add") {
      const word = interaction.options.getString("word", true).toLowerCase().trim();
      addWord(guildId, word);
      await interaction.reply({ content: `Added \`${word}\` to the word filter.`, ephemeral: true });

    } else if (sub === "remove") {
      const word = interaction.options.getString("word", true).toLowerCase().trim();
      const removed = removeWord(guildId, word);
      await interaction.reply({ content: removed ? `Removed \`${word}\` from the filter.` : `\`${word}\` was not in the filter.`, ephemeral: true });

    } else {
      const words = getWords(guildId);
      if (words.length === 0) {
        await interaction.reply({ content: "No words in the filter. Use `/wordfilter add` to add some.", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0xff8800)
        .setTitle("Word Filter")
        .setDescription(words.map(w => `\`${w}\``).join(", "))
        .setFooter({ text: `${words.length} filtered word(s)` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

export default command;
