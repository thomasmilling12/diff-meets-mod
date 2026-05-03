import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../client";
import { createCase } from "../../db/cases";
import { sendModLog } from "../../utils/modLog";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Timeout (mute) a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName("user").setDescription("The user to mute").setRequired(true))
    .addIntegerOption(o => o.setName("duration").setDescription("Duration in minutes (1-40320)").setMinValue(1).setMaxValue(40320).setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const durationMinutes = interaction.options.getInteger("duration", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const guildId = interaction.guildId!;

    const member = interaction.guild?.members.cache.get(target.id);
    if (!member?.moderatable) {
      await interaction.reply({ content: "I cannot mute this user.", ephemeral: true });
      return;
    }

    try {
      await member.timeout(durationMinutes * 60 * 1000, `${reason} | Muted by ${interaction.user.tag}`);

      const hours = Math.floor(durationMinutes / 60);
      const mins = durationMinutes % 60;
      const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

      const caseNum = createCase({
        guildId, action: "MUTE", userId: target.id, userTag: target.tag,
        moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, reason,
      });

      try {
        const { EmbedBuilder } = await import("discord.js");
        await target.send({ embeds: [new EmbedBuilder().setColor(0xffa500).setTitle(`🔇 Muted in ${interaction.guild?.name}`)
          .addFields({ name: "Reason", value: reason }, { name: "Duration", value: durationText, inline: true }, { name: "Moderator", value: interaction.user.tag, inline: true })
          .setTimestamp()] });
      } catch {}

      await interaction.reply({ content: `Muted **${target.tag}** for **${durationText}**. Case #${caseNum}\nReason: ${reason}` });
      await sendModLog(interaction.client, guildId, "MUTE", target, interaction.user.tag, reason, { Duration: durationText });
    } catch {
      await interaction.reply({ content: "Failed to mute the user.", ephemeral: true });
    }
  },
};

export default command;
