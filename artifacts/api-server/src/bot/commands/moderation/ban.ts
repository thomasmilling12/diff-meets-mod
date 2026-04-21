import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../client";
import { logAction } from "../../utils/logger";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("The user to ban").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("Reason for the ban").setRequired(false)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("delete_days")
        .setDescription("Number of days of messages to delete (0-7)")
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const deleteDays = interaction.options.getInteger("delete_days") ?? 0;

    const member = interaction.guild?.members.cache.get(target.id);

    if (member) {
      if (!member.bannable) {
        await interaction.reply({ content: "I cannot ban this user. They may have higher permissions than me.", ephemeral: true });
        return;
      }
    }

    try {
      await interaction.guild?.members.ban(target, {
        reason: `${reason} | Banned by ${interaction.user.tag}`,
        deleteMessageSeconds: deleteDays * 86400,
      });

      await interaction.reply({
        content: `Successfully banned **${target.tag}**.\nReason: ${reason}`,
      });

      await logAction(interaction, "BAN", target, reason);
    } catch (err) {
      await interaction.reply({ content: "Failed to ban the user. Please check my permissions.", ephemeral: true });
    }
  },
};

export default command;
