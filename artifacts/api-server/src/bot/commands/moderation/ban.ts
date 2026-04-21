import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../client";
import { createCase } from "../../db/cases";
import { sendModLog } from "../../utils/modLog";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName("user").setDescription("The user to ban").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason for the ban").setRequired(false))
    .addIntegerOption(o => o.setName("delete_days").setDescription("Days of messages to delete (0-7)").setMinValue(0).setMaxValue(7).setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const deleteDays = interaction.options.getInteger("delete_days") ?? 0;
    const guildId = interaction.guildId!;

    const member = interaction.guild?.members.cache.get(target.id);
    if (member && !member.bannable) {
      await interaction.reply({ content: "I cannot ban this user. They may have higher permissions.", ephemeral: true });
      return;
    }

    try {
      try { await target.send(`You have been **banned** from **${interaction.guild?.name}**.\nReason: ${reason}`); } catch {}
      await interaction.guild?.members.ban(target, {
        reason: `${reason} | Banned by ${interaction.user.tag}`,
        deleteMessageSeconds: deleteDays * 86400,
      });

      const caseNum = createCase({
        guildId, action: "BAN", userId: target.id, userTag: target.tag,
        moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, reason,
      });

      await interaction.reply({ content: `Successfully banned **${target.tag}**. Case #${caseNum}\nReason: ${reason}` });
      await sendModLog(interaction.client, guildId, "BAN", target, interaction.user.tag, reason);
    } catch {
      await interaction.reply({ content: "Failed to ban the user.", ephemeral: true });
    }
  },
};

export default command;
