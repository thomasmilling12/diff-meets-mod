import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, ChannelType, TextChannel } from "discord.js";
import type { Command } from "../../client";

function parseColor(str: string): number | null {
  const hex = str.replace(/^#/, "");
  const val = parseInt(hex, 16);
  return isNaN(val) ? null : val;
}

const PRESET_COLORS: Record<string, number> = {
  red: 0xff4444, blue: 0x5865f2, green: 0x00cc66, yellow: 0xffd700,
  orange: 0xff8800, purple: 0x9b59b6, pink: 0xff69b4, teal: 0x00b4d8,
  white: 0xffffff, black: 0x000001,
};

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Build and post a custom embed to any channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(o => o.setName("description").setDescription("Main body text of the embed").setRequired(true).setMaxLength(2000))
    .addStringOption(o => o.setName("title").setDescription("Embed title").setRequired(false).setMaxLength(256))
    .addStringOption(o => o.setName("color").setDescription("Color: hex #5865f2 or name (red/blue/green/etc)").setRequired(false))
    .addChannelOption(o => o.setName("channel").setDescription("Channel to send to (default: current)").addChannelTypes(ChannelType.GuildText).setRequired(false))
    .addStringOption(o => o.setName("footer").setDescription("Footer text").setRequired(false).setMaxLength(2048))
    .addStringOption(o => o.setName("image_url").setDescription("Image URL to attach at the bottom").setRequired(false))
    .addStringOption(o => o.setName("thumbnail_url").setDescription("Thumbnail URL (top right corner)").setRequired(false))
    .addBooleanOption(o => o.setName("timestamp").setDescription("Show current timestamp in the footer (default: true)").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const description = interaction.options.getString("description", true);
    const title = interaction.options.getString("title") ?? undefined;
    const colorStr = interaction.options.getString("color")?.toLowerCase();
    const footer = interaction.options.getString("footer") ?? undefined;
    const imageUrl = interaction.options.getString("image_url") ?? undefined;
    const thumbnailUrl = interaction.options.getString("thumbnail_url") ?? undefined;
    const showTimestamp = interaction.options.getBoolean("timestamp") ?? true;
    const channel = interaction.options.getChannel("channel") ?? interaction.channel;

    let color = 0x5865f2;
    if (colorStr) {
      const preset = PRESET_COLORS[colorStr];
      if (preset !== undefined) {
        color = preset;
      } else {
        const parsed = parseColor(colorStr);
        if (parsed !== null) color = parsed;
      }
    }

    const embed = new EmbedBuilder().setColor(color).setDescription(description);
    if (title) embed.setTitle(title);
    if (footer) embed.setFooter({ text: footer });
    if (imageUrl) embed.setImage(imageUrl);
    if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);
    if (showTimestamp) embed.setTimestamp();

    const targetChannel = interaction.guild?.channels.cache.get(channel!.id) as TextChannel | undefined;
    if (!targetChannel) {
      await interaction.reply({ content: "Channel not found.", ephemeral: true });
      return;
    }

    await targetChannel.send({ embeds: [embed] });
    await interaction.reply({
      content: channel!.id === interaction.channelId ? "Embed posted." : `Embed posted to <#${channel!.id}>.`,
      ephemeral: true,
    });
  },
};

export default command;
