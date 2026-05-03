import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { addWarning, getWarnings } from "../../db/warnings";
import { createCase } from "../../db/cases";
import { sendModLog } from "../../utils/modLog";
import { handleEscalation } from "../../utils/escalationHandler";
import { getEscalationRules } from "../../db/escalation";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName("user").setDescription("The user to warn").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason for the warning").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);
    const guildId = interaction.guildId!;

    addWarning(guildId, target.id, target.tag, reason, interaction.user.tag);
    const warnings = getWarnings(guildId, target.id);
    const warnCount = warnings.length;

    const caseNum = createCase({
      guildId, action: "WARN", userId: target.id, userTag: target.tag,
      moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, reason,
    });

    const rules = getEscalationRules(guildId);
    const nextRule = rules.filter(r => r.warn_count > warnCount).sort((a, b) => a.warn_count - b.warn_count)[0];
    const nextHint = nextRule
      ? `⚠️ **${nextRule.warn_count - warnCount}** more warning(s) → **${nextRule.action}**${nextRule.action === "MUTE" && nextRule.duration ? ` (${nextRule.duration}m)` : ""}`
      : null;

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle("Warning Issued")
      .addFields(
        { name: "User", value: `${target.tag} (${target.id})`, inline: true },
        { name: "Moderator", value: interaction.user.tag, inline: true },
        { name: "Reason", value: reason },
        { name: "Total Warnings", value: `${warnCount}`, inline: true },
        { name: "Case", value: `#${caseNum}`, inline: true },
        ...(nextHint ? [{ name: "Next Escalation", value: nextHint, inline: false }] : []),
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    await sendModLog(interaction.client, guildId, "WARN", target, interaction.user.tag, reason);

    try {
      await target.send({ embeds: [new EmbedBuilder().setColor(0xffdd00).setTitle(`⚠️ Warning in ${interaction.guild?.name}`)
        .addFields(
          { name: "Reason", value: reason },
          { name: "Moderator", value: interaction.user.tag, inline: true },
          { name: "Total Warnings", value: `${warnCount}`, inline: true },
        ).setFooter({ text: "Continued violations may result in further action." }).setTimestamp()] });
    } catch {}

    if (interaction.guild) {
      const escalationMsg = await handleEscalation(
        interaction.client, guildId, target.id, target.tag, warnCount, interaction.guild,
      );
      if (escalationMsg) {
        await interaction.followUp({ content: `⚠️ **Auto-escalation triggered:** ${escalationMsg}` });
      }
    }
  },
};

export default command;
