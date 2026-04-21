import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../client";
import { logAction } from "../../utils/logger";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((opt) =>
      opt.setName("user_id").setDescription("The user ID to unban").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("Reason for the unban").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.options.getString("user_id", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";

    try {
      const bannedUser = await interaction.guild?.bans.fetch(userId);
      if (!bannedUser) {
        await interaction.reply({ content: "This user is not banned.", ephemeral: true });
        return;
      }

      await interaction.guild?.members.unban(userId, `${reason} | Unbanned by ${interaction.user.tag}`);

      await interaction.reply({
        content: `Successfully unbanned **${bannedUser.user.tag}**.\nReason: ${reason}`,
      });

      await logAction(interaction, "UNBAN", bannedUser.user, reason);
    } catch {
      await interaction.reply({ content: "Failed to unban. Make sure the user ID is valid and they are banned.", ephemeral: true });
    }
  },
};

export default command;
