import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, ChannelType } from "discord.js";
import type { Command } from "../../client";
import { addAutoThreadChannel, removeAutoThreadChannel, getAutoThreadChannels } from "../../db/autoThread";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("auto-thread")
    .setDescription("Auto-create threads on every post in a channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("add").setDescription("Enable auto-threading for a channel")
      .addChannelOption(o => o.setName("channel").setDescription("Channel to enable auto-threading in").addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addStringOption(o => o.setName("format").setDescription("Thread name format, use {title} for first 50 chars of message (default: {title})").setRequired(false))
      .addIntegerOption(o => o.setName("archive").setDescription("Hours until thread auto-archives (1, 24, 72, 168 — default: 24)").setRequired(false)
        .addChoices({ name: "1 hour", value: 1 }, { name: "24 hours", value: 24 }, { name: "3 days", value: 72 }, { name: "1 week", value: 168 })))
    .addSubcommand(s => s.setName("remove").setDescription("Disable auto-threading for a channel")
      .addChannelOption(o => o.setName("channel").setDescription("Channel").addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("List auto-thread channels")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "add") {
      const channel = interaction.options.getChannel("channel", true);
      const format = interaction.options.getString("format") ?? "{title}";
      const archive = interaction.options.getInteger("archive") ?? 24;
      addAutoThreadChannel(guildId, channel.id, format, archive);
      await interaction.reply({ content: `Auto-threading enabled in <#${channel.id}>. Every new message will get a thread (archives after ${archive}h).` });
    } else if (sub === "remove") {
      const channel = interaction.options.getChannel("channel", true);
      const removed = removeAutoThreadChannel(guildId, channel.id);
      await interaction.reply({ content: removed ? `Auto-threading disabled in <#${channel.id}>.` : "That channel is not set for auto-threading.", ephemeral: !removed });
    } else {
      const channels = getAutoThreadChannels(guildId);
      if (channels.length === 0) {
        await interaction.reply({ content: "No auto-thread channels configured.", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Auto-Thread Channels")
        .setDescription(channels.map(c => `<#${c.channel_id}>\nFormat: \`${c.thread_name_format}\` • Archive: ${c.archive_hours}h`).join("\n\n"))
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
