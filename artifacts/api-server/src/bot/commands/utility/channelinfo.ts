import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, TextChannel, VoiceChannel, CategoryChannel, NewsChannel, StageChannel, ForumChannel, ChannelType } from "discord.js";
import type { Command } from "../../client";

const TYPE_NAMES: Partial<Record<ChannelType, string>> = {
  [ChannelType.GuildText]: "Text Channel",
  [ChannelType.GuildVoice]: "Voice Channel",
  [ChannelType.GuildCategory]: "Category",
  [ChannelType.GuildAnnouncement]: "Announcement Channel",
  [ChannelType.GuildStageVoice]: "Stage Channel",
  [ChannelType.GuildForum]: "Forum Channel",
  [ChannelType.PublicThread]: "Public Thread",
  [ChannelType.PrivateThread]: "Private Thread",
};

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("channelinfo")
    .setDescription("Show detailed info about a channel")
    .addChannelOption(o => o.setName("channel").setDescription("Channel to inspect (default: current)").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getChannel("channel") ?? interaction.channel;
    const guild = interaction.guild!;
    const ch = guild.channels.cache.get(target!.id);
    if (!ch) { await interaction.reply({ content: "Channel not found.", ephemeral: true }); return; }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`#${ch.name}`)
      .addFields(
        { name: "ID", value: ch.id, inline: true },
        { name: "Type", value: TYPE_NAMES[ch.type] ?? "Unknown", inline: true },
        { name: "Created", value: `<t:${Math.floor(ch.createdTimestamp! / 1000)}:R>`, inline: true },
      );

    if (ch.parent) embed.addFields({ name: "Category", value: ch.parent.name, inline: true });

    if (ch instanceof TextChannel || ch instanceof NewsChannel) {
      embed.addFields(
        { name: "Topic", value: ch.topic || "None" },
        { name: "NSFW", value: ch.nsfw ? "Yes" : "No", inline: true },
        { name: "Slowmode", value: ch.rateLimitPerUser ? `${ch.rateLimitPerUser}s` : "Off", inline: true },
      );
    }

    if (ch instanceof VoiceChannel || ch instanceof StageChannel) {
      embed.addFields(
        { name: "Bitrate", value: `${ch.bitrate / 1000}kbps`, inline: true },
        { name: "User Limit", value: ch.userLimit ? `${ch.userLimit}` : "Unlimited", inline: true },
        { name: "Connected", value: `${ch.members.size}`, inline: true },
      );
    }

    if (ch instanceof CategoryChannel) {
      const children = guild.channels.cache.filter(c => c.parentId === ch.id);
      embed.addFields({ name: "Channels in Category", value: `${children.size}`, inline: true });
    }

    const overwrites = ("permissionOverwrites" in ch) ? (ch.permissionOverwrites?.cache.size ?? 0) : 0;
    embed.addFields({ name: "Permission Overwrites", value: `${overwrites}`, inline: true });
    embed.setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
