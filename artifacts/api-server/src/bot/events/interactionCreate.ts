import { Client, Events, Interaction, TextChannel, PermissionFlagsBits } from "discord.js";
import { commands } from "../client";
import { findByMessageId } from "../db/buttonRoles";
import { getVerificationConfig } from "../db/verification";
import { getTicketConfig, createTicket, getOpenTicketCount, getTicketByChannel, closeTicket } from "../db/tickets";
import { generateTranscript } from "../utils/ticketTranscript";
import { botLogger } from "../logger";
import { ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } from "discord.js";

export function registerInteractionCreateEvent(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        botLogger.error({ err, command: interaction.commandName }, "Error executing command");
        const msg = { content: "An error occurred while running this command.", ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg).catch(() => {});
        } else {
          await interaction.reply(msg).catch(() => {});
        }
      }
      return;
    }

    if (!interaction.isButton()) return;
    const { customId, guildId, guild } = interaction;
    if (!guildId || !guild) return;

    // ── Button role toggle ────────────────────────────────────────────────────
    if (customId.startsWith("role_toggle_")) {
      const roleId = customId.replace("role_toggle_", "");
      const buttonRoles = findByMessageId(interaction.message.id);
      const buttonRole = buttonRoles.find(r => r.role_id === roleId);
      if (!buttonRole) return;
      const member = guild.members.cache.get(interaction.user.id);
      if (!member) return;
      const role = guild.roles.cache.get(roleId);
      if (!role) { await interaction.reply({ content: "That role no longer exists.", ephemeral: true }); return; }
      try {
        if (member.roles.cache.has(roleId)) {
          await member.roles.remove(role);
          await interaction.reply({ content: `Removed role **${role.name}**.`, ephemeral: true });
        } else {
          await member.roles.add(role);
          await interaction.reply({ content: `Added role **${role.name}**.`, ephemeral: true });
        }
      } catch {
        await interaction.reply({ content: "Failed to update your role.", ephemeral: true });
      }
      return;
    }

    // ── Verification ──────────────────────────────────────────────────────────
    if (customId === "verify_click") {
      const config = getVerificationConfig(guildId);
      if (!config.role_id) { await interaction.reply({ content: "Verification is not configured.", ephemeral: true }); return; }
      const member = guild.members.cache.get(interaction.user.id);
      if (!member) return;
      if (member.roles.cache.has(config.role_id)) {
        await interaction.reply({ content: "You are already verified!", ephemeral: true });
        return;
      }
      try {
        await member.roles.add(config.role_id);
        await interaction.reply({ content: "✅ You have been verified and granted access!", ephemeral: true });
      } catch {
        await interaction.reply({ content: "Failed to give you the verified role. Please contact a moderator.", ephemeral: true });
      }
      return;
    }

    // ── Ticket create (from panel) ────────────────────────────────────────────
    if (customId === "ticket_create") {
      const config = getTicketConfig(guildId);
      if (!config.support_role_id) { await interaction.reply({ content: "Ticket system not configured.", ephemeral: true }); return; }
      const openCount = getOpenTicketCount(guildId, interaction.user.id);
      if (openCount >= config.max_open) {
        await interaction.reply({ content: `You already have ${openCount} open ticket(s). Please close them first.`, ephemeral: true });
        return;
      }
      await interaction.deferReply({ ephemeral: true });
      try {
        const channel = await guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: ChannelType.GuildText,
          parent: config.category_id ?? undefined,
          permissionOverwrites: [
            { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            { id: config.support_role_id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            { id: client.user!.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
          ],
        });
        const ticketId = createTicket(guildId, channel.id, interaction.user.id, interaction.user.tag);
        const embed = new EmbedBuilder().setColor(0x5865f2).setTitle(`🎫 Ticket #${ticketId}`)
          .setDescription(`Hello ${interaction.user}! Support will be with you shortly.`)
          .setFooter({ text: "Click Close Ticket when resolved" }).setTimestamp();
        const closeBtn = new ButtonBuilder().setCustomId(`ticket_close_${ticketId}`).setLabel("Close Ticket").setEmoji("🔒").setStyle(ButtonStyle.Danger);
        await channel.send({ content: `${interaction.user} | <@&${config.support_role_id}>`, embeds: [embed], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(closeBtn)] });
        await interaction.editReply({ content: `Your ticket: <#${channel.id}>` });
      } catch {
        await interaction.editReply({ content: "Failed to create ticket. Please contact a moderator." });
      }
      return;
    }

    // ── Ticket close (from button) ────────────────────────────────────────────
    if (customId.startsWith("ticket_close_")) {
      const ticket = getTicketByChannel(interaction.channelId);
      if (!ticket || ticket.status === "closed") return;
      const config = getTicketConfig(guildId);
      const member = guild.members.cache.get(interaction.user.id);
      const isSupport = config.support_role_id && member?.roles.cache.has(config.support_role_id);
      const isOwner = ticket.user_id === interaction.user.id;
      const isAdmin = member?.permissions.has(PermissionFlagsBits.ManageGuild);
      if (!isSupport && !isOwner && !isAdmin) {
        await interaction.reply({ content: "You don't have permission to close this ticket.", ephemeral: true });
        return;
      }
      await interaction.reply({ content: "🔒 Closing ticket..." });
      await generateTranscript(interaction, ticket, config, "Closed via button");
      closeTicket(ticket.id, interaction.user.tag);
      setTimeout(async () => { await interaction.channel?.delete().catch(() => {}); }, 3000);
    }
  });
}
