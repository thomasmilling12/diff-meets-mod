import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ChannelType } from "discord.js";
import type { Command } from "../../client";
import { setWelcome, disableWelcome, getConfig } from "../../db/guildConfig";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Configure welcome messages for new members")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("set").setDescription("Set welcome channel and message")
      .addChannelOption(o => o.setName("channel").setDescription("Channel to send welcome in").addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addStringOption(o => o.setName("message").setDescription("Message ({user} = mention, {server} = server name, {count} = member count)").setRequired(true)))
    .addSubcommand(s => s.setName("disable").setDescription("Disable welcome messages"))
    .addSubcommand(s => s.setName("status").setDescription("View current welcome config")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "set") {
      const channel = interaction.options.getChannel("channel", true);
      const message = interaction.options.getString("message", true);
      setWelcome(guildId, channel.id, message);
      await interaction.reply({ content: `Welcome messages set in <#${channel.id}>.\nMessage preview: ${message.replace("{user}", interaction.user.toString()).replace("{server}", interaction.guild?.name ?? "Server").replace("{count}", String(interaction.guild?.memberCount ?? 0))}` });

    } else if (sub === "disable") {
      disableWelcome(guildId);
      await interaction.reply({ content: "Welcome messages disabled." });

    } else {
      const config = getConfig(guildId);
      if (!config.welcome_channel_id) {
        await interaction.reply({ content: "Welcome messages are not configured. Use `/welcome set` to set them up." });
      } else {
        await interaction.reply({ content: `Welcome channel: <#${config.welcome_channel_id}>\nMessage: ${config.welcome_message}` });
      }
    }
  },
};

export default command;
