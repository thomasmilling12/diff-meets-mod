import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../client";
import { createCase } from "../../db/cases";
import { sendModLog } from "../../utils/modLog";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Remove timeout (unmute) from a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName("user").setDescription("The user to unmute").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason for the unmute").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const guildId = interaction.guildId!;

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

      const caseNum = createCase({
        guildId, action: "UNMUTE", userId: target.id, userTag: target.tag,
        moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, reason,
      });

      try { await target.send(`Your timeout in **${interaction.guild?.name}** has been removed.\nReason: ${reason}`); } catch {}

      await interaction.reply({ content: `Successfully unmuted **${target.tag}**. Case #${caseNum}\nReason: ${reason}` });
      await sendModLog(interaction.client, guildId, "UNMUTE", target, interaction.user.tag, reason);
    } catch {
      await interaction.reply({ content: "Failed to unmute the user.", ephemeral: true });
    }
  },
};

export default command;
