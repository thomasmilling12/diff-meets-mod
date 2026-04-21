import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { addNote, getNotes, deleteNote } from "../../db/notes";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("note")
    .setDescription("Manage private moderator notes on users")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(s => s.setName("add").setDescription("Add a note")
      .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
      .addStringOption(o => o.setName("note").setDescription("Note content").setRequired(true)))
    .addSubcommand(s => s.setName("view").setDescription("View notes for a user")
      .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)))
    .addSubcommand(s => s.setName("delete").setDescription("Delete a note by ID")
      .addIntegerOption(o => o.setName("id").setDescription("Note ID").setRequired(true))),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "add") {
      const target = interaction.options.getUser("user", true);
      const noteText = interaction.options.getString("note", true);
      addNote(guildId, target.id, target.tag, noteText, interaction.user.tag);
      await interaction.reply({ content: `Note added for **${target.tag}**.`, ephemeral: true });

    } else if (sub === "view") {
      const target = interaction.options.getUser("user", true);
      const notes = getNotes(guildId, target.id);
      if (notes.length === 0) {
        await interaction.reply({ content: `No notes for **${target.tag}**.`, ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x99aab5)
        .setTitle(`Notes for ${target.tag}`)
        .setDescription(notes.map(n => `**ID ${n.id}** — ${n.note}\n  By: ${n.moderator_tag} <t:${n.created_at}:R>`).join("\n\n"))
        .setFooter({ text: `${notes.length} note(s)` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else {
      const id = interaction.options.getInteger("id", true);
      const removed = deleteNote(id, guildId);
      await interaction.reply({ content: removed ? `Note #${id} deleted.` : `Note #${id} not found.`, ephemeral: true });
    }
  },
};

export default command;
