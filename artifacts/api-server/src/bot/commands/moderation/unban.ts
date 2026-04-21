import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../client";
import { createCase } from "../../db/cases";
import { sendModLog } from "../../utils/modLog";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a previously banned user")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(o => o.setName("user_id").setDescription("The user ID to unban").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason for the unban").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.options.getString("user_id", true).trim();
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const guildId = interaction.guildId!;

    try {
      const bannedUser = await interaction.guild?.bans.fetch(userId);
      if (!bannedUser) {
        await interaction.reply({ content: "This user is not banned.", ephemeral: true });
        return;
      }

      await interaction.guild?.members.unban(userId, `${reason} | Unbanned by ${interaction.user.tag}`);

      const caseNum = createCase({
        guildId, action: "UNBAN", userId, userTag: bannedUser.user.tag,
        moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, reason,
      });

      await interaction.reply({ content: `Successfully unbanned **${bannedUser.user.tag}**. Case #${caseNum}\nReason: ${reason}` });
      await sendModLog(interaction.client, guildId, "UNBAN", bannedUser.user, interaction.user.tag, reason);
    } catch {
      await interaction.reply({ content: "Failed to unban. Make sure the user ID is valid and they are banned.", ephemeral: true });
    }
  },
};

export default command;
