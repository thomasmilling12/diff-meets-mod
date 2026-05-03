import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, ChannelType } from "discord.js";
import type { Command } from "../../client";
import { setupCounting, getCounting, resetCount, disableCounting } from "../../db/countingChannels";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("counting")
    .setDescription("Configure a counting game channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(s => s.setName("setup").setDescription("Set up counting in a channel")
      .addChannelOption(o => o.setName("channel").setDescription("Channel for counting").addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addIntegerOption(o => o.setName("start").setDescription("Starting number (default: 0)").setMinValue(0).setRequired(false)))
    .addSubcommand(s => s.setName("disable").setDescription("Disable the counting channel"))
    .addSubcommand(s => s.setName("reset").setDescription("Reset the count back to 0"))
    .addSubcommand(s => s.setName("status").setDescription("Show current count and stats")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel", true);
      const start = interaction.options.getInteger("start") ?? 0;
      setupCounting(guildId, channel.id, start);
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle("🔢 Counting Setup")
          .setDescription(`Counting channel set to <#${channel.id}>.\nNext number to count: **${start + 1}**\n\n• Send only the next number — no other text\n• Each person must wait for someone else to count before going again\n• Breaking the count resets it back to 0`)
          .setTimestamp()],
      });

    } else if (sub === "disable") {
      const removed = disableCounting(guildId);
      await interaction.reply({ content: removed ? "Counting channel disabled." : "No counting channel was set.", ephemeral: !removed });

    } else if (sub === "reset") {
      const config = getCounting(guildId);
      if (!config) { await interaction.reply({ content: "No counting channel configured.", ephemeral: true }); return; }
      resetCount(guildId);
      await interaction.reply({ content: `Count reset to 0 in <#${config.channel_id}>. Next number: **1**` });

    } else {
      const config = getCounting(guildId);
      if (!config) { await interaction.reply({ content: "No counting channel configured.", ephemeral: true }); return; }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🔢 Counting Stats")
        .addFields(
          { name: "Channel", value: `<#${config.channel_id}>`, inline: true },
          { name: "Current Count", value: `${config.current_count}`, inline: true },
          { name: "Next Number", value: `${config.current_count + 1}`, inline: true },
          { name: "High Score", value: `${config.high_score}`, inline: true },
          { name: "Total Counts", value: `${config.total_counts}`, inline: true },
          { name: "Last Counter", value: config.last_user_id ? `<@${config.last_user_id}>` : "Nobody yet", inline: true },
        ).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
