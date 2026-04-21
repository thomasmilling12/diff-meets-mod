import {
  SlashCommandBuilder, ChatInputCommandInteraction, ChannelType,
  PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder,
} from "discord.js";
import type { Command } from "../../client";
import { getTicketConfig, createTicket, getOpenTicketCount } from "../../db/tickets";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Open a support ticket")
    .addStringOption(o => o.setName("reason").setDescription("Briefly describe your issue").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const guildId = interaction.guildId!;
    const config = getTicketConfig(guildId);

    if (!config.support_role_id) {
      await interaction.reply({ content: "The ticket system has not been set up yet. Ask an admin to run `/ticket-setup config`.", ephemeral: true });
      return;
    }

    const openCount = getOpenTicketCount(guildId, interaction.user.id);
    if (openCount >= config.max_open) {
      await interaction.reply({ content: `You already have ${openCount} open ticket(s). Please close existing ticket(s) first.`, ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const channel = await interaction.guild!.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: config.category_id ?? undefined,
        topic: `Ticket by ${interaction.user.tag} | Reason: ${reason}`,
        permissionOverwrites: [
          { id: interaction.guild!.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          { id: config.support_role_id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          { id: interaction.client.user!.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
        ],
      });

      const ticketId = createTicket(guildId, channel.id, interaction.user.id, interaction.user.tag, reason);

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🎫 Ticket #${ticketId}`)
        .setDescription(`Hello ${interaction.user}, thank you for reaching out!\n\nA member of the support team will be with you shortly.\n**Reason:** ${reason}`)
        .setFooter({ text: "Click Close Ticket when resolved" })
        .setTimestamp();

      const closeButton = new ButtonBuilder()
        .setCustomId(`ticket_close_${ticketId}`)
        .setLabel("Close Ticket")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton);
      await channel.send({ content: `${interaction.user} | <@&${config.support_role_id}>`, embeds: [embed], components: [row] });
      await interaction.editReply({ content: `Your ticket has been created: <#${channel.id}>` });
    } catch {
      await interaction.editReply({ content: "Failed to create your ticket channel. Please contact a moderator." });
    }
  },
};

export default command;
