import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../client";
import { logAction } from "../../utils/logger";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Remove timeout (unmute) from a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("The user to unmute").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("Reason for the unmute").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";

    const member = interaction.guild?.members.cache.get(target.id);
    if (!member) {
      await interaction.reply({ content: "Could not find that member in this server.", ephemeral: true });
      return;
    }

    if (!member.isCommunicationDisabled()) {
      await interaction.reply({ content: "This user is not muted.", ephemeral: true });
      return;
    }

    try {
      await member.timeout(null, `${reason} | Unmuted by ${interaction.user.tag}`);

      await interaction.reply({
        content: `Successfully unmuted **${target.tag}**.\nReason: ${reason}`,
      });

      await logAction(interaction, "UNMUTE", target, reason);
    } catch {
      await interaction.reply({ content: "Failed to unmute the user.", ephemeral: true });
    }
  },
};

export default command;
