import {
  SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction,
  ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder,
} from "discord.js";
import type { Command } from "../../client";
import { getTicketConfig, setTicketConfig } from "../../db/tickets";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ticket-setup")
    .setDescription("Configure the ticket system")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("config").setDescription("Set ticket system options")
      .addRoleOption(o => o.setName("support_role").setDescription("Role that can see all tickets").setRequired(true))
      .addChannelOption(o => o.setName("category").setDescription("Category channel for tickets").addChannelTypes(ChannelType.GuildCategory).setRequired(false))
      .addChannelOption(o => o.setName("log_channel").setDescription("Channel for ticket transcripts").addChannelTypes(ChannelType.GuildText).setRequired(false))
      .addIntegerOption(o => o.setName("max_open").setDescription("Max open tickets per user (default: 1)").setMinValue(1).setMaxValue(5).setRequired(false)))
    .addSubcommand(s => s.setName("panel").setDescription("Send a ticket creation panel to a channel")
      .addChannelOption(o => o.setName("channel").setDescription("Channel to send the panel in").addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addStringOption(o => o.setName("title").setDescription("Panel embed title").setRequired(false))
      .addStringOption(o => o.setName("description").setDescription("Panel embed description").setRequired(false)))
    .addSubcommand(s => s.setName("status").setDescription("Show current ticket config")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "config") {
      const role = interaction.options.getRole("support_role", true);
      const category = interaction.options.getChannel("category");
      const logChannel = interaction.options.getChannel("log_channel");
      const maxOpen = interaction.options.getInteger("max_open") ?? 1;
      setTicketConfig(guildId, {
        support_role_id: role.id,
        category_id: category?.id ?? null,
        log_channel_id: logChannel?.id ?? null,
        max_open: maxOpen,
      });
      await interaction.reply({ content: `Ticket system configured.\nSupport role: <@&${role.id}>\nMax open per user: ${maxOpen}` });
    } else if (sub === "panel") {
      const channel = interaction.options.getChannel("channel", true);
      const title = interaction.options.getString("title") ?? "Support Tickets";
      const description = interaction.options.getString("description") ?? "Click the button below to open a support ticket. A private channel will be created for you.";

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🎫 ${title}`)
        .setDescription(description)
        .setTimestamp();

      const button = new ButtonBuilder()
        .setCustomId("ticket_create")
        .setLabel("Open a Ticket")
        .setEmoji("🎫")
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
      const textChannel = interaction.guild?.channels.cache.get(channel.id);
      if (!textChannel?.isTextBased()) {
        await interaction.reply({ content: "That channel is not a text channel.", ephemeral: true });
        return;
      }
      const msg = await (textChannel as import("discord.js").TextChannel).send({ embeds: [embed], components: [row] });
      setTicketConfig(guildId, { panel_channel_id: channel.id, panel_message_id: msg.id });
      await interaction.reply({ content: `Ticket panel sent to <#${channel.id}>.` });
    } else {
      const c = getTicketConfig(guildId);
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Ticket System Config")
        .addFields(
          { name: "Support Role", value: c.support_role_id ? `<@&${c.support_role_id}>` : "Not set", inline: true },
          { name: "Category", value: c.category_id ? `<#${c.category_id}>` : "None", inline: true },
          { name: "Log Channel", value: c.log_channel_id ? `<#${c.log_channel_id}>` : "None", inline: true },
          { name: "Max Open", value: `${c.max_open}`, inline: true },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
