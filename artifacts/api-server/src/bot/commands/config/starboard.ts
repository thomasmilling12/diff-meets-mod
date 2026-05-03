import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, ChannelType } from "discord.js";
import type { Command } from "../../client";
import { getStarboardConfig, setStarboardConfig } from "../../db/starboard";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("starboard")
    .setDescription("Configure the starboard")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("setup").setDescription("Set the starboard channel and threshold")
      .addChannelOption(o => o.setName("channel").setDescription("Starboard channel").addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addIntegerOption(o => o.setName("threshold").setDescription("Stars needed (default: 3)").setMinValue(1).setRequired(false))
      .addStringOption(o => o.setName("emoji").setDescription("Reaction emoji (default: ⭐)").setRequired(false)))
    .addSubcommand(s => s.setName("disable").setDescription("Disable the starboard"))
    .addSubcommand(s => s.setName("enable").setDescription("Re-enable the starboard"))
    .addSubcommand(s => s.setName("status").setDescription("Show starboard config")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel", true);
      const threshold = interaction.options.getInteger("threshold") ?? 3;
      const emoji = interaction.options.getString("emoji") ?? "⭐";
      setStarboardConfig(guildId, { channel_id: channel.id, threshold, emoji, enabled: 1 });
      await interaction.reply({ content: `Starboard set to <#${channel.id}> — ${emoji} × ${threshold} to star a message.` });
    } else if (sub === "disable") {
      setStarboardConfig(guildId, { enabled: 0 });
      await interaction.reply({ content: "Starboard disabled." });
    } else if (sub === "enable") {
      setStarboardConfig(guildId, { enabled: 1 });
      await interaction.reply({ content: "Starboard enabled." });
    } else {
      const c = getStarboardConfig(guildId);
      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("Starboard Config")
        .addFields(
          { name: "Status", value: c.enabled ? "Enabled" : "Disabled", inline: true },
          { name: "Channel", value: c.channel_id ? `<#${c.channel_id}>` : "Not set", inline: true },
          { name: "Threshold", value: `${c.threshold} × ${c.emoji}`, inline: true },
        ).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
