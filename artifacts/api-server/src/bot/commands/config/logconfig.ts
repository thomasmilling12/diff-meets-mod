import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, ChannelType } from "discord.js";
import type { Command } from "../../client";
import { getConfig, setLogChannel, setExtendedLogChannel, type ExtendedLogType } from "../../db/guildConfig";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("logconfig")
    .setDescription("Configure logging channels for different event types")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("set").setDescription("Set a log channel")
      .addStringOption(o => o.setName("type").setDescription("Log type").setRequired(true)
        .addChoices(
          { name: "mod — bans, kicks, warns, etc.", value: "mod" },
          { name: "messages — edits and deletes", value: "messages" },
          { name: "members — joins and leaves", value: "members" },
          { name: "voice — voice channel events", value: "voice" },
          { name: "roles — role/nickname changes", value: "roles" },
        ))
      .addChannelOption(o => o.setName("channel").setDescription("Channel to log to").addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand(s => s.setName("disable").setDescription("Disable a log type")
      .addStringOption(o => o.setName("type").setDescription("Log type to disable").setRequired(true)
        .addChoices(
          { name: "mod", value: "mod" },
          { name: "messages", value: "messages" },
          { name: "members", value: "members" },
          { name: "voice", value: "voice" },
          { name: "roles", value: "roles" },
        )))
    .addSubcommand(s => s.setName("status").setDescription("Show all configured log channels")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "set") {
      const type = interaction.options.getString("type", true);
      const channel = interaction.options.getChannel("channel", true);
      if (type === "mod") {
        setLogChannel(guildId, channel.id);
      } else {
        setExtendedLogChannel(guildId, type as ExtendedLogType, channel.id);
      }
      await interaction.reply({ content: `**${type}** logs will now be sent to <#${channel.id}>.` });
    } else if (sub === "disable") {
      const type = interaction.options.getString("type", true);
      if (type === "mod") {
        setLogChannel(guildId, null);
      } else {
        setExtendedLogChannel(guildId, type as ExtendedLogType, null);
      }
      await interaction.reply({ content: `**${type}** logging disabled.` });
    } else {
      const config = getConfig(guildId);
      const ch = (id: string | null) => id ? `<#${id}>` : "Not set";
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Log Channel Configuration")
        .addFields(
          { name: "Mod Actions", value: ch(config.log_channel_id), inline: true },
          { name: "Messages", value: ch(config.log_messages_channel_id), inline: true },
          { name: "Members", value: ch(config.log_members_channel_id), inline: true },
          { name: "Voice", value: ch(config.log_voice_channel_id), inline: true },
          { name: "Roles", value: ch(config.log_roles_channel_id), inline: true },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
