import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ChannelType } from "discord.js";
import type { Command } from "../../client";
import { setLogChannel, getLogChannel } from "../../db/guildConfig";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("log")
    .setDescription("Manage the logging channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("setchannel").setDescription("Set the channel where mod actions are logged")
      .addChannelOption(o => o.setName("channel").setDescription("The channel to log to").addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(s => s.setName("disable").setDescription("Disable logging"))
    .addSubcommand(s => s.setName("status").setDescription("Show current log channel")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "setchannel") {
      const channel = interaction.options.getChannel("channel", true);
      setLogChannel(guildId, channel.id);
      await interaction.reply({ content: `Logging channel set to <#${channel.id}>.` });
    } else if (sub === "disable") {
      setLogChannel(guildId, null);
      await interaction.reply({ content: "Logging has been disabled." });
    } else {
      const channelId = getLogChannel(guildId);
      await interaction.reply({ content: channelId ? `Current log channel: <#${channelId}>` : "Logging is currently disabled. Use `/log setchannel` to enable it." });
    }
  },
};

export default command;
