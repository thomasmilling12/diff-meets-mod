import {
  Client, Events, Interaction, TextChannel, PermissionFlagsBits,
  ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder,
  UserContextMenuCommandInteraction, MessageContextMenuCommandInteraction,
} from "discord.js";
import { commands } from "../client";
import { findByMessageId } from "../db/buttonRoles";
import { getVerificationConfig } from "../db/verification";
import { getTicketConfig, createTicket, getOpenTicketCount, getTicketByChannel, closeTicket } from "../db/tickets";
import { generateTranscript } from "../utils/ticketTranscript";
import { addWarning, getWarnings } from "../db/warnings";
import { createCase } from "../db/cases";
import { sendModLog } from "../utils/modLog";
import { handleEscalation } from "../utils/escalationHandler";
import { botLogger } from "../logger";

export function registerInteractionCreateEvent(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {

    // ── Slash commands ────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        botLogger.error({ err, command: interaction.commandName }, "Error executing command");
        const msg = { content: "An error occurred.", ephemeral: true };
        if (interaction.replied || interaction.deferred) await interaction.followUp(msg).catch(() => {});
        else await interaction.reply(msg).catch(() => {});
      }
      return;
    }

    // ── Context menus ─────────────────────────────────────────────────────────
    if (interaction.isUserContextMenuCommand() || interaction.isMessageContextMenuCommand()) {
      const command = commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction as UserContextMenuCommandInteraction & MessageContextMenuCommandInteraction);
      } catch (err) {
        botLogger.error({ err, command: interaction.commandName }, "Context menu error");
        await interaction.reply({ content: "An error occurred.", ephemeral: true }).catch(() => {});
      }
      return;
    }

    // ── Modals ────────────────────────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      const guildId = interaction.guildId;
      if (!guildId || !interaction.guild) return;

      // Quick Warn modal
      if (interaction.customId.startsWith("quickwarn_")) {
        const userId = interaction.customId.replace("quickwarn_", "");
        const reason = interaction.fields.getTextInputValue("reason");
        const targetMember = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!targetMember) { await interaction.reply({ content: "User not found.", ephemeral: true }); return; }
        addWarning(guildId, userId, targetMember.user.tag, reason, interaction.user.tag);
        const warnings = getWarnings(guildId, userId);
        const caseNum = createCase({ guildId, action: "WARN", userId, userTag: targetMember.user.tag, moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, reason });
        await interaction.reply({ content: `⚠️ Warned **${targetMember.user.tag}** — ${reason}\nTotal warnings: ${warnings.length} | Case #${caseNum}`, ephemeral: true });
        await sendModLog(client, guildId, "WARN", targetMember.user, interaction.user.tag, reason);
        try { await targetMember.user.send(`You were **warned** in **${interaction.guild.name}**.\nReason: ${reason}\nTotal warnings: ${warnings.length}`); } catch {}
        if (interaction.guild) {
          const esc = await handleEscalation(client, guildId, userId, targetMember.user.tag, warnings.length, interaction.guild);
          if (esc) await interaction.followUp({ content: `⚠️ Auto-escalation: ${esc}`, ephemeral: true });
        }
        return;
      }

      // Quick Ban modal
      if (interaction.customId.startsWith("quickban_")) {
        const userId = interaction.customId.replace("quickban_", "");
        const reason = interaction.fields.getTextInputValue("reason");
        const targetUser = await client.users.fetch(userId).catch(() => null);
        if (!targetUser) { await interaction.reply({ content: "User not found.", ephemeral: true }); return; }
        try {
          try { await targetUser.send(`You have been **banned** from **${interaction.guild.name}**.\nReason: ${reason}`); } catch {}
          await interaction.guild.members.ban(userId, { reason });
          const caseNum = createCase({ guildId, action: "BAN", userId, userTag: targetUser.tag, moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, reason });
          await interaction.reply({ content: `🔨 Banned **${targetUser.tag}** — ${reason} | Case #${caseNum}`, ephemeral: true });
          await sendModLog(client, guildId, "BAN", targetUser, interaction.user.tag, reason);
        } catch { await interaction.reply({ content: "Failed to ban. Check my permissions.", ephemeral: true }); }
        return;
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
          await interaction.reply({ content: `Removed **${role.name}**.`, ephemeral: true });
        } else {
          await member.roles.add(role);
          await interaction.reply({ content: `Added **${role.name}**.`, ephemeral: true });
        }
      } catch { await interaction.reply({ content: "Failed to update role.", ephemeral: true }); }
      return;
    }

    // ── Verification ──────────────────────────────────────────────────────────
    if (customId === "verify_click") {
      const config = getVerificationConfig(guildId);
      if (!config.role_id) { await interaction.reply({ content: "Verification not configured.", ephemeral: true }); return; }
      const member = guild.members.cache.get(interaction.user.id);
      if (!member) return;
      if (member.roles.cache.has(config.role_id)) { await interaction.reply({ content: "You are already verified!", ephemeral: true }); return; }
      try {
        await member.roles.add(config.role_id);
        await interaction.reply({ content: "✅ You are now verified!", ephemeral: true });
      } catch { await interaction.reply({ content: "Failed to verify. Contact a moderator.", ephemeral: true }); }
      return;
    }

    // ── Ticket create (panel button) ──────────────────────────────────────────
    if (customId === "ticket_create") {
      const config = getTicketConfig(guildId);
      if (!config.support_role_id) { await interaction.reply({ content: "Ticket system not configured.", ephemeral: true }); return; }
      if (getOpenTicketCount(guildId, interaction.user.id) >= config.max_open) {
        await interaction.reply({ content: `You already have the maximum open tickets (${config.max_open}).`, ephemeral: true }); return;
      }
      await interaction.deferReply({ ephemeral: true });
      try {
        const channel = await guild.channels.create({
          name: `ticket-${String(Date.now()).slice(-4)}-${interaction.user.username.slice(0, 12)}`,
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
          .setFooter({ text: "Use the buttons to close or claim this ticket" }).setTimestamp();
        const closeBtn = new ButtonBuilder().setCustomId(`ticket_close_${ticketId}`).setLabel("Close").setEmoji("🔒").setStyle(ButtonStyle.Danger);
        const claimBtn = new ButtonBuilder().setCustomId(`ticket_claim_${ticketId}`).setLabel("Claim").setEmoji("✋").setStyle(ButtonStyle.Secondary);
        await channel.send({ content: `${interaction.user} | <@&${config.support_role_id}>`, embeds: [embed], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(claimBtn, closeBtn)] });
        await interaction.editReply({ content: `Your ticket: <#${channel.id}>` });
      } catch { await interaction.editReply({ content: "Failed to create ticket." }); }
      return;
    }

    // ── Ticket claim ──────────────────────────────────────────────────────────
    if (customId.startsWith("ticket_claim_")) {
      const ticket = getTicketByChannel(interaction.channelId);
      if (!ticket || ticket.status === "closed") return;
      const config = getTicketConfig(guildId);
      const member = guild.members.cache.get(interaction.user.id);
      const isSupport = config.support_role_id && member?.roles.cache.has(config.support_role_id);
      const isAdmin = member?.permissions.has(PermissionFlagsBits.ManageGuild);
      if (!isSupport && !isAdmin) { await interaction.reply({ content: "Only support staff can claim tickets.", ephemeral: true }); return; }
      const { db } = await import("../db/database");
      db.prepare("UPDATE tickets SET claimed_by_tag = ? WHERE id = ?").run(interaction.user.tag, ticket.id);
      await interaction.reply({ content: `✋ **${interaction.user.tag}** has claimed this ticket.` });
      return;
    }

    // ── Ticket close (button) ─────────────────────────────────────────────────
    if (customId.startsWith("ticket_close_")) {
      const ticket = getTicketByChannel(interaction.channelId);
      if (!ticket || ticket.status === "closed") return;
      const config = getTicketConfig(guildId);
      const member = guild.members.cache.get(interaction.user.id);
      const isSupport = config.support_role_id && member?.roles.cache.has(config.support_role_id);
      const isOwner = ticket.user_id === interaction.user.id;
      const isAdmin = member?.permissions.has(PermissionFlagsBits.ManageGuild);
      if (!isSupport && !isOwner && !isAdmin) { await interaction.reply({ content: "No permission.", ephemeral: true }); return; }
      await interaction.reply({ content: "🔒 Closing ticket..." });
      await generateTranscript(interaction, ticket, config, "Closed via button");
      closeTicket(ticket.id, interaction.user.tag);
      setTimeout(async () => { await interaction.channel?.delete().catch(() => {}); }, 3000);
      return;
    }
  });
}
