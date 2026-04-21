import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../client";
import { logAction } from "../../utils/logger";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("The user to kick").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("Reason for the kick").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";

    const member = interaction.guild?.members.cache.get(target.id);
    if (!member) {
      await interaction.reply({ content: "Could not find that member in this server.", ephemeral: true });
      return;
    }

    if (!member.kickable) {
      await interaction.reply({ content: "I cannot kick this user. They may have higher permissions.", ephemeral: true });
      return;
    }

    try {
      await member.kick(`${reason} | Kicked by ${interaction.user.tag}`);

      await interaction.reply({
        content: `Successfully kicked **${target.tag}**.\nReason: ${reason}`,
      });

      await logAction(interaction, "KICK", target, reason);
    } catch {
      await interaction.reply({ content: "Failed to kick the user.", ephemeral: true });
    }
  },
};

export default command;
