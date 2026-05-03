import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, ChannelType } from "discord.js";
import type { Command } from "../../client";
import { getModmailConfig, setModmailConfig } from "../../db/modmail";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("modmail")
    .setDescription("Configure the modmail system")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("setup").setDescription("Set up modmail")
      .addChannelOption(o => o.setName("category").setDescription("Category for modmail threads").addChannelTypes(ChannelType.GuildCategory).setRequired(true))
      .addChannelOption(o => o.setName("log_channel").setDescription("Channel for modmail logs").addChannelTypes(ChannelType.GuildText).setRequired(false))
      .addStringOption(o => o.setName("response").setDescription("Auto-response sent to users when they DM the bot").setRequired(false)))
    .addSubcommand(s => s.setName("enable").setDescription("Enable modmail"))
    .addSubcommand(s => s.setName("disable").setDescription("Disable modmail"))
    .addSubcommand(s => s.setName("close").setDescription("Close the current modmail thread"))
    .addSubcommand(s => s.setName("status").setDescription("Show modmail config")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "setup") {
      const category = interaction.options.getChannel("category", true);
      const logChannel = interaction.options.getChannel("log_channel");
      const response = interaction.options.getString("response");
      setModmailConfig(guildId, {
        category_id: category.id,
        log_channel_id: logChannel?.id ?? null,
        ...(response ? { response_message: response } : {}),
        enabled: 1,
      });
      await interaction.reply({ content: `Modmail set up. Users who DM the bot will get a private channel in <#${category.id}>.` });
    } else if (sub === "enable") {
      setModmailConfig(guildId, { enabled: 1 });
      await interaction.reply({ content: "Modmail enabled." });
    } else if (sub === "disable") {
      setModmailConfig(guildId, { enabled: 0 });
      await interaction.reply({ content: "Modmail disabled." });
    } else if (sub === "close") {
      const { getModmailByChannel, closeModmailThread } = await import("../../db/modmail");
      const thread = getModmailByChannel(interaction.channelId);
      if (!thread || thread.status === "closed") {
        await interaction.reply({ content: "This is not an open modmail channel.", ephemeral: true });
        return;
      }
      closeModmailThread(thread.id);
      await interaction.reply({ content: "Modmail thread closed. This channel can now be deleted." });
    } else {
      const c = getModmailConfig(guildId);
      const embed = new EmbedBuilder()
        .setColor(c.enabled ? 0x5865f2 : 0x888888)
        .setTitle("Modmail Config")
        .addFields(
          { name: "Status", value: c.enabled ? "Enabled" : "Disabled", inline: true },
          { name: "Category", value: c.category_id ? `<#${c.category_id}>` : "Not set", inline: true },
          { name: "Log Channel", value: c.log_channel_id ? `<#${c.log_channel_id}>` : "None", inline: true },
          { name: "Auto-Response", value: c.response_message?.slice(0, 100) ?? "Default" },
        ).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
