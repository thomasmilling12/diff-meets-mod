import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ChannelType, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { enableAutoPublish, disableAutoPublish, getAutoPublishChannels } from "../../db/autoPublish";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("autopublish")
    .setDescription("Auto-crosspost messages in announcement (News) channels")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("enable").setDescription("Enable auto-publish for an announcement channel")
      .addChannelOption(o => o.setName("channel").setDescription("Announcement channel").addChannelTypes(ChannelType.GuildAnnouncement).setRequired(true)))
    .addSubcommand(s => s.setName("disable").setDescription("Disable auto-publish for a channel")
      .addChannelOption(o => o.setName("channel").setDescription("Channel to disable").addChannelTypes(ChannelType.GuildAnnouncement).setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("List all auto-publish channels")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "enable") {
      const channel = interaction.options.getChannel("channel", true);
      enableAutoPublish(guildId, channel.id);
      await interaction.reply({ content: `✅ Messages in <#${channel.id}> will now be automatically crossposted.` });

    } else if (sub === "disable") {
      const channel = interaction.options.getChannel("channel", true);
      const removed = disableAutoPublish(guildId, channel.id);
      await interaction.reply({ content: removed ? `Auto-publish disabled for <#${channel.id}>.` : "Auto-publish was not enabled for that channel.", ephemeral: !removed });

    } else {
      const channels = getAutoPublishChannels(guildId);
      if (channels.length === 0) {
        await interaction.reply({ content: "No auto-publish channels configured.", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Auto-Publish Channels")
        .setDescription(channels.map(id => `<#${id}>`).join("\n"))
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
