import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ChannelType } from "discord.js";
import type { Command } from "../../client";
import { setLogChannel, disableLog, getLogChannel } from "../../utils/guildConfig";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("log")
    .setDescription("Manage the logging channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("setchannel")
        .setDescription("Set the channel where mod actions are logged")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("The channel to log to")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("Disable logging")
    )
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("Show current log channel")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "setchannel") {
      const channel = interaction.options.getChannel("channel", true);
      setLogChannel(guildId, channel.id);
      await interaction.reply({ content: `Logging channel set to <#${channel.id}>.` });
    } else if (sub === "disable") {
      disableLog(guildId);
      await interaction.reply({ content: "Logging has been disabled." });
    } else if (sub === "status") {
      const channelId = getLogChannel(guildId);
      if (channelId) {
        await interaction.reply({ content: `Current log channel: <#${channelId}>` });
      } else {
        await interaction.reply({ content: "Logging is currently disabled. Use `/log setchannel` to enable it." });
      }
    }
  },
};

export default command;
