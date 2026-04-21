import {
  SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction,
  EmbedBuilder, ChannelType, TextChannel, Colors,
} from "discord.js";
import type { Command } from "../../client";

const COLOR_MAP: Record<string, number> = {
  blue: Colors.Blue, red: Colors.Red, green: Colors.Green,
  yellow: Colors.Yellow, purple: Colors.Purple, orange: Colors.Orange,
  default: 0x5865f2,
};

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Send a formatted announcement embed")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(o => o.setName("message").setDescription("Announcement content").setRequired(true))
    .addChannelOption(o => o.setName("channel").setDescription("Channel to send in (defaults to current)").addChannelTypes(ChannelType.GuildText).setRequired(false))
    .addStringOption(o => o.setName("title").setDescription("Embed title").setRequired(false))
    .addStringOption(o => o.setName("color").setDescription("Embed color").addChoices(
      { name: "Blue", value: "blue" }, { name: "Red", value: "red" }, { name: "Green", value: "green" },
      { name: "Yellow", value: "yellow" }, { name: "Purple", value: "purple" }, { name: "Orange", value: "orange" },
    ).setRequired(false))
    .addBooleanOption(o => o.setName("ping_everyone").setDescription("Ping @everyone").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const message = interaction.options.getString("message", true);
    const title = interaction.options.getString("title") ?? "Announcement";
    const colorKey = interaction.options.getString("color") ?? "default";
    const pingEveryone = interaction.options.getBoolean("ping_everyone") ?? false;
    const targetChannel = interaction.options.getChannel("channel");

    const channel = targetChannel
      ? (interaction.guild?.channels.cache.get(targetChannel.id) as TextChannel)
      : (interaction.channel as TextChannel);

    if (!channel) {
      await interaction.reply({ content: "Could not find that channel.", ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(COLOR_MAP[colorKey] ?? 0x5865f2)
      .setTitle(title)
      .setDescription(message)
      .setFooter({ text: `Posted by ${interaction.user.tag}` })
      .setTimestamp();

    await channel.send({
      content: pingEveryone ? "@everyone" : undefined,
      embeds: [embed],
    });

    await interaction.reply({ content: `Announcement sent in <#${channel.id}>.`, ephemeral: true });
  },
};

export default command;
