import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { getConfig } from "../../db/guildConfig";
import { getEscalationRules } from "../../db/escalation";
import { getRaidConfig } from "../../db/raidProtection";
import { getTicketConfig } from "../../db/tickets";
import { getStarboardConfig } from "../../db/starboard";
import { getModmailConfig } from "../../db/modmail";
import { getVerificationConfig } from "../../db/verification";
import { getStatsChannels } from "../../db/statsChannels";
import { getInviteTracking } from "../../db/inviteTracking";

function ch(id: string | null | undefined): string { return id ? `<#${id}>` : "Not set"; }
function on(val: number | null | undefined): string { return val ? "✅ On" : "❌ Off"; }

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("config-status")
    .setDescription("Show all bot settings for this server in one place")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const cfg = getConfig(guildId);
    const raid = getRaidConfig(guildId);
    const ticket = getTicketConfig(guildId);
    const star = getStarboardConfig(guildId);
    const mm = getModmailConfig(guildId);
    const verify = getVerificationConfig(guildId);
    const stats = getStatsChannels(guildId);
    const escalation = getEscalationRules(guildId);
    const invites = getInviteTracking(guildId);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`⚙️ Config Status — ${interaction.guild?.name}`)
      .addFields(
        {
          name: "📋 Log Channels",
          value: [
            `Mod Actions: ${ch(cfg.log_channel_id)}`,
            `Messages: ${ch(cfg.log_messages_channel_id)}`,
            `Members: ${ch(cfg.log_members_channel_id)}`,
            `Voice: ${ch(cfg.log_voice_channel_id)}`,
            `Roles: ${ch(cfg.log_roles_channel_id)}`,
            `Server: ${ch((cfg as unknown as Record<string, string>).log_server_channel_id)}`,
          ].join("\n"),
        },
        {
          name: "🤖 Auto-Mod",
          value: [
            `Anti-Spam: ${on(cfg.automod_anti_spam)}`,
            `Anti-Invite: ${on(cfg.automod_anti_invite)}`,
            `Anti-Caps: ${on(cfg.automod_anti_caps)}`,
            `Anti-Mention: ${on(cfg.automod_anti_mention)}`,
            `Anti-Links: ${on(cfg.automod_anti_links)}`,
            `Anti-Phishing: ${on(cfg.automod_anti_phishing)}`,
          ].join("  "),
          inline: false,
        },
        {
          name: "👋 Welcome & Roles",
          value: [
            `Welcome: ${cfg.welcome_channel_id ? ch(cfg.welcome_channel_id) : "Off"}`,
            `Auto-Role: ${cfg.auto_role_id ? `<@&${cfg.auto_role_id}>` : "Not set"}`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "📈 Escalation",
          value: escalation.length > 0
            ? escalation.map(r => `${r.warn_count}w → ${r.action}${r.action === "MUTE" ? ` ${r.duration}m` : ""}`).join(", ")
            : "Not configured",
          inline: true,
        },
        {
          name: "🚨 Raid Protection",
          value: `${on(raid.enabled)} • ${raid.join_threshold} joins/${raid.time_window}s → ${raid.action}`,
          inline: true,
        },
        {
          name: "🎫 Tickets",
          value: ticket.support_role_id ? `Role: <@&${ticket.support_role_id}> • Max: ${ticket.max_open}` : "Not configured",
          inline: true,
        },
        {
          name: "✅ Verification",
          value: verify.role_id ? `Role: <@&${verify.role_id}> in ${ch(verify.channel_id)}` : "Not configured",
          inline: true,
        },
        {
          name: "⭐ Starboard",
          value: star.channel_id ? `${on(star.enabled)} • ${ch(star.channel_id)} • ${star.emoji} × ${star.threshold}` : "Not configured",
          inline: true,
        },
        {
          name: "✉️ Modmail",
          value: mm.category_id ? `${on(mm.enabled)} • Category: <#${mm.category_id}>` : "Not configured",
          inline: true,
        },
        {
          name: "📊 Stats Channels",
          value: stats.length > 0 ? stats.map(s => `${s.type}: <#${s.channel_id}>`).join(", ") : "None",
          inline: true,
        },
        {
          name: "📨 Invite Tracking",
          value: `${on(invites.enabled)}${invites.log_channel_id ? ` • ${ch(invites.log_channel_id)}` : ""}`,
          inline: true,
        },
      )
      .setFooter({ text: "Use /logconfig, /raid, /ticket-setup etc. to change settings" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

export default command;
