import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, TextChannel } from "discord.js";
import type { Command } from "../../client";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Delete a number of messages from the channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((opt) =>
      opt
        .setName("amount")
        .setDescription("Number of messages to delete (1-100)")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .addUserOption((opt) =>
      opt.setName("user").setDescription("Only delete messages from this user").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger("amount", true);
    const filterUser = interaction.options.getUser("user");

    const channel = interaction.channel as TextChannel;

    try {
      const messages = await channel.messages.fetch({ limit: amount });
      const toDelete = filterUser
        ? messages.filter((m) => m.author.id === filterUser.id)
        : messages;

      const deleted = await channel.bulkDelete(toDelete, true);

      await interaction.reply({
        content: `Deleted **${deleted.size}** message(s)${filterUser ? ` from ${filterUser.tag}` : ""}.`,
        ephemeral: true,
      });
    } catch {
      await interaction.reply({ content: "Failed to delete messages. Messages older than 14 days cannot be bulk deleted.", ephemeral: true });
    }
  },
};

export default command;
