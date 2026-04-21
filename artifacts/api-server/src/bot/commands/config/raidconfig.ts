import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { getRaidConfig, setRaidConfig } from "../../db/raidProtection";
import { manualUnlock } from "../../utils/raidProtectionHandler";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("raid")
    .setDescription("Configure raid protection")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("setup").setDescription("Configure raid protection settings")
      .addIntegerOption(o => o.setName("threshold").setDescription("Joins to trigger raid mode (default: 10)").setMinValue(3).setRequired(false))
      .addIntegerOption(o => o.setName("window").setDescription("Time window in seconds (default: 10)").setMinValue(3).setRequired(false))
      .addStringOption(o => o.setName("action").setDescription("Action on raid detection (default: LOCK)").setRequired(false)
        .addChoices({ name: "Lock channels", value: "LOCK" }, { name: "Lock + kick joiners", value: "KICK" }))
      .addIntegerOption(o => o.setName("auto_unlock").setDescription("Auto-unlock after N minutes, 0 to disable (default: 5)").setMinValue(0).setRequired(false)))
    .addSubcommand(s => s.setName("enable").setDescription("Enable raid protection"))
    .addSubcommand(s => s.setName("disable").setDescription("Disable raid protection"))
    .addSubcommand(s => s.setName("unlock").setDescription("Manually lift an active raid lockdown"))
    .addSubcommand(s => s.setName("status").setDescription("Show current raid protection config")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "setup") {
      const settings: Record<string, number | string> = {};
      const threshold = interaction.options.getInteger("threshold");
      const window_ = interaction.options.getInteger("window");
      const action = interaction.options.getString("action");
      const autoUnlock = interaction.options.getInteger("auto_unlock");
      if (threshold !== null) settings.join_threshold = threshold;
      if (window_ !== null) settings.time_window = window_;
      if (action) settings.action = action;
      if (autoUnlock !== null) settings.auto_unlock_minutes = autoUnlock;
      setRaidConfig(guildId, settings);
      await interaction.reply({ content: "Raid protection settings updated. Use `/raid enable` to activate." });
    } else if (sub === "enable") {
      setRaidConfig(guildId, { enabled: 1 });
      await interaction.reply({ content: "Raid protection **enabled**." });
    } else if (sub === "disable") {
      setRaidConfig(guildId, { enabled: 0 });
      await interaction.reply({ content: "Raid protection **disabled**." });
    } else if (sub === "unlock") {
      manualUnlock(guildId);
      await interaction.reply({ content: "Raid lockdown manually lifted. Channels should be restored." });
    } else {
      const c = getRaidConfig(guildId);
      const embed = new EmbedBuilder()
        .setColor(c.enabled ? 0x00cc66 : 0x888888)
        .setTitle("Raid Protection")
        .addFields(
          { name: "Status", value: c.enabled ? "Enabled" : "Disabled", inline: true },
          { name: "Threshold", value: `${c.join_threshold} joins`, inline: true },
          { name: "Window", value: `${c.time_window}s`, inline: true },
          { name: "Action", value: c.action, inline: true },
          { name: "Auto-Unlock", value: c.auto_unlock_minutes > 0 ? `${c.auto_unlock_minutes}m` : "Manual only", inline: true },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
