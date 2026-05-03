import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, ChannelType } from "discord.js";
import type { Command } from "../../client";
import { createScheduledAnnouncement, getPendingAnnouncements, deleteScheduledAnnouncement } from "../../db/scheduledAnnouncements";

function parseDuration(str: string): number | null {
  const parts = str.match(/(\d+)\s*(s|sec|m|min|h|hr|d|day)s?/gi);
  if (!parts) return null;
  let total = 0;
  const mul: Record<string, number> = { s: 1, sec: 1, m: 60, min: 60, h: 3600, hr: 3600, d: 86400, day: 86400 };
  for (const p of parts) {
    const m = p.match(/(\d+)\s*(\w+)/i);
    if (!m) continue;
    const unit = m[2].toLowerCase().replace(/s$/, "");
    total += parseInt(m[1]) * (mul[unit] ?? 0);
  }
  return total > 0 ? total : null;
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("schedule")
    .setDescription("Schedule an announcement to post after a delay")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("create").setDescription("Schedule a message")
      .addChannelOption(o => o.setName("channel").setDescription("Channel to post in").addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addStringOption(o => o.setName("delay").setDescription("When to post e.g. 30m, 2h, 1d").setRequired(true))
      .addStringOption(o => o.setName("message").setDescription("Message content").setRequired(true).setMaxLength(2000)))
    .addSubcommand(s => s.setName("list").setDescription("List pending announcements"))
    .addSubcommand(s => s.setName("cancel").setDescription("Cancel a scheduled announcement")
      .addIntegerOption(o => o.setName("id").setDescription("ID from /schedule list").setRequired(true))),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "create") {
      const channel = interaction.options.getChannel("channel", true);
      const delay = interaction.options.getString("delay", true);
      const message = interaction.options.getString("message", true);
      const secs = parseDuration(delay);
      if (!secs || secs < 30) {
        await interaction.reply({ content: "Invalid delay. Try `30m`, `2h`, `1d`. Minimum is 30 seconds.", ephemeral: true });
        return;
      }
      if (secs > 30 * 86400) {
        await interaction.reply({ content: "Maximum scheduled delay is 30 days.", ephemeral: true });
        return;
      }
      const sendAt = Math.floor(Date.now() / 1000) + secs;
      const id = createScheduledAnnouncement(guildId, channel.id, message, sendAt, interaction.user.tag);
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("📅 Announcement Scheduled")
        .addFields(
          { name: "Channel", value: `<#${channel.id}>`, inline: true },
          { name: "Posts", value: `<t:${sendAt}:R> (<t:${sendAt}:f>)`, inline: true },
          { name: "ID", value: `#${id}`, inline: true },
          { name: "Message", value: message.slice(0, 300) + (message.length > 300 ? "…" : "") },
        ).setTimestamp();
      await interaction.reply({ embeds: [embed] });

    } else if (sub === "list") {
      const pending = getPendingAnnouncements(guildId);
      if (pending.length === 0) {
        await interaction.reply({ content: "No pending scheduled announcements.", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Pending Announcements")
        .setDescription(pending.map(a =>
          `**#${a.id}** — <#${a.channel_id}> — <t:${a.send_at}:R>\n${a.message.slice(0, 80)}${a.message.length > 80 ? "…" : ""}`
        ).join("\n\n"))
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else {
      const id = interaction.options.getInteger("id", true);
      const deleted = deleteScheduledAnnouncement(id, guildId);
      await interaction.reply({ content: deleted ? `Announcement #${id} cancelled.` : "Announcement not found.", ephemeral: true });
    }
  },
};

export default command;
