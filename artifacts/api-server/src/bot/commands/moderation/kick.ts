import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../client";
import { createCase } from "../../db/cases";
import { sendModLog } from "../../utils/modLog";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName("user").setDescription("The user to kick").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason for the kick").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const guildId = interaction.guildId!;

    const member = interaction.guild?.members.cache.get(target.id);
    if (!member || !member.kickable) {
      await interaction.reply({ content: "I cannot kick this user.", ephemeral: true });
      return;
    }

    try {
      try { await target.send(`You have been **kicked** from **${interaction.guild?.name}**.\nReason: ${reason}`); } catch {}
      await member.kick(`${reason} | Kicked by ${interaction.user.tag}`);

      const caseNum = createCase({
        guildId, action: "KICK", userId: target.id, userTag: target.tag,
        moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, reason,
      });

      await interaction.reply({ content: `Successfully kicked **${target.tag}**. Case #${caseNum}\nReason: ${reason}` });
      await sendModLog(interaction.client, guildId, "KICK", target, interaction.user.tag, reason);
    } catch {
      await interaction.reply({ content: "Failed to kick the user.", ephemeral: true });
    }
  },
};

export default command;
