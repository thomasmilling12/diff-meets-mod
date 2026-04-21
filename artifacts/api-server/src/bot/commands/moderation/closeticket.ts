import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import type { Command } from "../../client";
import { getTicketByChannel, closeTicket, getTicketConfig } from "../../db/tickets";
import { generateTranscript } from "../../utils/ticketTranscript";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("close-ticket")
    .setDescription("Close and archive this support ticket")
    .addStringOption(o => o.setName("reason").setDescription("Reason for closing").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const ticket = getTicketByChannel(interaction.channelId);
    if (!ticket || ticket.status === "closed") {
      await interaction.reply({ content: "This command can only be used inside an open ticket channel.", ephemeral: true });
      return;
    }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const config = getTicketConfig(ticket.guild_id);
    const isSupport = config.support_role_id && member?.roles.cache.has(config.support_role_id);
    const isOwner = ticket.user_id === interaction.user.id;
    const isAdmin = member?.permissions.has(PermissionFlagsBits.ManageGuild);

    if (!isSupport && !isOwner && !isAdmin) {
      await interaction.reply({ content: "You don't have permission to close this ticket.", ephemeral: true });
      return;
    }

    const reason = interaction.options.getString("reason") ?? "No reason provided";
    await interaction.reply({ content: `🔒 Closing ticket... Generating transcript.` });

    await generateTranscript(interaction, ticket, config, reason);
    closeTicket(ticket.id, interaction.user.tag);

    setTimeout(async () => {
      await interaction.channel?.delete().catch(() => {});
    }, 3000);
  },
};

export default command;
