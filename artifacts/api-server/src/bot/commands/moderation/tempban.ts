import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../client";
import { createCase } from "../../db/cases";
import { sendModLog } from "../../utils/modLog";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("tempban")
    .setDescription("Temporarily ban a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName("user").setDescription("User to ban").setRequired(true))
    .addIntegerOption(o => o.setName("duration").setDescription("Duration in hours").setMinValue(1).setMaxValue(8760).setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const hours = interaction.options.getInteger("duration", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const guildId = interaction.guildId!;

    const member = interaction.guild?.members.cache.get(target.id);
    if (member && !member.bannable) {
      await interaction.reply({ content: "I cannot ban this user.", ephemeral: true });
      return;
    }

    const expiresAt = Math.floor(Date.now() / 1000) + hours * 3600;

    try {
      try { await target.send(`You have been temporarily banned from **${interaction.guild?.name}** for **${hours}h**.\nReason: ${reason}`); } catch {}
      await interaction.guild?.members.ban(target, { reason: `[TEMPBAN ${hours}h] ${reason} | By ${interaction.user.tag}` });

      const caseNum = createCase({
        guildId, action: "TEMPBAN", userId: target.id, userTag: target.tag,
        moderatorId: interaction.user.id, moderatorTag: interaction.user.tag,
        reason, expiresAt,
      });

      await interaction.reply({ content: `Temporarily banned **${target.tag}** for **${hours} hour(s)**. Case #${caseNum}\nReason: ${reason}` });
      await sendModLog(interaction.client, guildId, "TEMPBAN", target, interaction.user.tag, reason, { Duration: `${hours}h`, Expires: `<t:${expiresAt}:R>` });
    } catch {
      await interaction.reply({ content: "Failed to temp-ban the user.", ephemeral: true });
    }
  },
};

export default command;
