import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, SlashCommandStringOption, SlashCommandIntegerOption } from "discord.js";
import type { Command } from "../../client";
import { createTag, getTag, editTag, deleteTag, listTags, countTags, useTag } from "../../db/tags";

const PAGE_SIZE = 15;

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("tag")
    .setDescription("Server tags — reusable text snippets")
    .addSubcommand(s => s.setName("use").setDescription("Send a tag in this channel")
      .addStringOption((o: SlashCommandStringOption) => o.setName("name").setDescription("Tag name").setRequired(true).setMaxLength(32)))
    .addSubcommand(s => s.setName("create").setDescription("Create a new tag (Manage Messages)")
      .addStringOption((o: SlashCommandStringOption) => o.setName("name").setDescription("Tag name (letters, numbers, dashes only)").setRequired(true).setMaxLength(32))
      .addStringOption((o: SlashCommandStringOption) => o.setName("content").setDescription("Tag content").setRequired(true).setMaxLength(2000)))
    .addSubcommand(s => s.setName("edit").setDescription("Edit an existing tag (Manage Messages)")
      .addStringOption((o: SlashCommandStringOption) => o.setName("name").setDescription("Tag name to edit").setRequired(true))
      .addStringOption((o: SlashCommandStringOption) => o.setName("content").setDescription("New content").setRequired(true).setMaxLength(2000)))
    .addSubcommand(s => s.setName("delete").setDescription("Delete a tag (Manage Messages)")
      .addStringOption((o: SlashCommandStringOption) => o.setName("name").setDescription("Tag name to delete").setRequired(true)))
    .addSubcommand(s => s.setName("info").setDescription("Show info about a tag")
      .addStringOption(o => o.setName("name").setDescription("Tag name").setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("List all server tags")
      .addIntegerOption(o => o.setName("page").setDescription("Page number").setMinValue(1).setRequired(false))),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "use") {
      const name = interaction.options.getString("name", true);
      const tag = getTag(guildId, name);
      if (!tag) { await interaction.reply({ content: `Tag \`${name}\` not found.`, ephemeral: true }); return; }
      useTag(tag.id);
      await interaction.reply({ content: tag.content });

    } else if (sub === "create") {
      const name = interaction.options.getString("name", true);
      const content = interaction.options.getString("content", true);
      if (!/^[\w-]+$/.test(name)) { await interaction.reply({ content: "Tag names can only contain letters, numbers, underscores, and dashes.", ephemeral: true }); return; }
      const created = createTag(guildId, name, content, interaction.user.id);
      await interaction.reply({ content: created ? `✅ Tag \`${name}\` created.` : `A tag with that name already exists.`, ephemeral: !created });

    } else if (sub === "edit") {
      const name = interaction.options.getString("name", true);
      const content = interaction.options.getString("content", true);
      const edited = editTag(guildId, name, content);
      await interaction.reply({ content: edited ? `Tag \`${name}\` updated.` : `Tag \`${name}\` not found.`, ephemeral: !edited });

    } else if (sub === "delete") {
      const name = interaction.options.getString("name", true);
      const deleted = deleteTag(guildId, name);
      await interaction.reply({ content: deleted ? `Tag \`${name}\` deleted.` : `Tag \`${name}\` not found.`, ephemeral: !deleted });

    } else if (sub === "info") {
      const name = interaction.options.getString("name", true);
      const tag = getTag(guildId, name);
      if (!tag) { await interaction.reply({ content: `Tag \`${name}\` not found.`, ephemeral: true }); return; }
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle(`Tag: ${tag.name}`)
          .addFields(
            { name: "Created By", value: `<@${tag.author_id}>`, inline: true },
            { name: "Uses", value: `${tag.uses}`, inline: true },
            { name: "Created", value: `<t:${tag.created_at}:R>`, inline: true },
            { name: "Content Preview", value: tag.content.slice(0, 200) },
          ).setTimestamp()],
        ephemeral: true,
      });

    } else {
      const page = (interaction.options.getInteger("page") ?? 1) - 1;
      const total = countTags(guildId);
      const tags = listTags(guildId, PAGE_SIZE, page * PAGE_SIZE);
      if (tags.length === 0) { await interaction.reply({ content: page > 0 ? `No tags on page ${page + 1}.` : "No tags yet. Create one with `/tag create`.", ephemeral: true }); return; }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Server Tags")
        .setDescription(tags.map(t => `\`${t.name}\` — ${t.uses} uses`).join("\n"))
        .setFooter({ text: `Page ${page + 1}/${Math.ceil(total / PAGE_SIZE)} • ${total} tag(s)` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
