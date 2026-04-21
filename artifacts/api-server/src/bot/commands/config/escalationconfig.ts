import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { getEscalationRules, addEscalationRule, removeEscalationRule } from "../../db/escalation";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("escalation")
    .setDescription("Configure automatic punishment escalation based on warning count")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("add").setDescription("Add an escalation rule")
      .addIntegerOption(o => o.setName("warnings").setDescription("Warning count to trigger at").setMinValue(1).setRequired(true))
      .addStringOption(o => o.setName("action").setDescription("Action to take").setRequired(true)
        .addChoices({ name: "Mute", value: "MUTE" }, { name: "Kick", value: "KICK" }, { name: "Ban", value: "BAN" }))
      .addIntegerOption(o => o.setName("duration").setDescription("Mute duration in minutes (only for mute)").setMinValue(1).setRequired(false)))
    .addSubcommand(s => s.setName("remove").setDescription("Remove an escalation rule")
      .addIntegerOption(o => o.setName("warnings").setDescription("Warning count of the rule to remove").setMinValue(1).setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("Show all escalation rules")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "add") {
      const count = interaction.options.getInteger("warnings", true);
      const action = interaction.options.getString("action", true);
      const duration = interaction.options.getInteger("duration") ?? undefined;
      if (action === "MUTE" && !duration) {
        await interaction.reply({ content: "Please provide a duration in minutes for mute escalation.", ephemeral: true });
        return;
      }
      addEscalationRule(guildId, count, action, duration);
      const durationText = action === "MUTE" ? ` for ${duration}m` : "";
      await interaction.reply({ content: `At **${count} warnings** → **${action}${durationText}**. Rule added.` });
    } else if (sub === "remove") {
      const count = interaction.options.getInteger("warnings", true);
      const removed = removeEscalationRule(guildId, count);
      await interaction.reply({ content: removed ? `Removed escalation rule at ${count} warnings.` : `No rule found at ${count} warnings.`, ephemeral: !removed });
    } else {
      const rules = getEscalationRules(guildId);
      if (rules.length === 0) {
        await interaction.reply({ content: "No escalation rules set. Use `/escalation add` to create some.", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0xff6600)
        .setTitle("Auto-Escalation Rules")
        .setDescription(rules.map(r => {
          const dur = r.action === "MUTE" && r.duration ? ` for ${r.duration}m` : "";
          return `**${r.warn_count} warnings** → ${r.action}${dur}`;
        }).join("\n"))
        .setFooter({ text: "Triggered automatically when /warn is used" })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
