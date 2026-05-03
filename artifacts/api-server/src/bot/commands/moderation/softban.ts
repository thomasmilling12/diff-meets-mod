import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { createCase } from "../../db/cases";
import { sendModLog } from "../../utils/modLog";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("softban")
    .setDescription("Ban then immediately unban a member to delete their messages without keeping them banned")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName("user").setDescription("Member to softban").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason for the softban").setRequired(false))
    .addIntegerOption(o => o.setName("delete_days").setDescription("Days of messages to delete (1-7, default: 1)").setMinValue(1).setMaxValue(7).setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const deleteDays = interaction.options.getInteger("delete_days") ?? 1;
    const guildId = interaction.guildId!;

    const member = interaction.guild?.members.cache.get(target.id);
    if (member && !member.bannable) {
      await interaction.reply({ content: "I cannot ban this user. They may have higher permissions.", ephemeral: true });
      return;
    }

    await interaction.deferReply();

    try {
      try {
        await target.send({ embeds: [new EmbedBuilder().setColor(0xff8800).setTitle(`🔨 Softbanned from ${interaction.guild?.name}`)
          .setDescription("You were softbanned to clean up your messages. You may rejoin with a fresh invite.")
          .addFields({ name: "Reason", value: reason }, { name: "Moderator", value: interaction.user.tag, inline: true })
          .setTimestamp()] });
      } catch { /* DMs closed */ }

      await interaction.guild?.members.ban(target, {
        reason: `[Softban] ${reason} | By ${interaction.user.tag}`,
        deleteMessageSeconds: deleteDays * 86400,
      });
      await interaction.guild?.members.unban(target, "Softban — auto-unban");

      const caseNum = createCase({
        guildId, action: "SOFTBAN", userId: target.id, userTag: target.tag,
        moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, reason,
      });

      const embed = new EmbedBuilder()
        .setColor(0xff8800)
        .setTitle("Softban Applied")
        .addFields(
          { name: "User", value: `${target.tag} (${target.id})`, inline: true },
          { name: "Moderator", value: interaction.user.tag, inline: true },
          { name: "Messages Deleted", value: `${deleteDays} day(s)`, inline: true },
          { name: "Reason", value: reason },
          { name: "Case", value: `#${caseNum}`, inline: true },
        ).setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      await sendModLog(interaction.client, guildId, "SOFTBAN", target, interaction.user.tag, reason);
    } catch {
      await interaction.editReply({ content: "Failed to softban the user." });
    }
  },
};

export default command;
