import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { createReminder, getUserReminders, deleteReminder } from "../../db/reminders";

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
    .setName("remind")
    .setDescription("Set a reminder — the bot will DM or ping you")
    .addSubcommand(s => s.setName("me").setDescription("Set a reminder")
      .addStringOption(o => o.setName("time").setDescription("When e.g. 30m, 2h, 1d").setRequired(true))
      .addStringOption(o => o.setName("message").setDescription("What to remind you about").setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("List your active reminders"))
    .addSubcommand(s => s.setName("cancel").setDescription("Cancel a reminder")
      .addIntegerOption(o => o.setName("id").setDescription("Reminder ID from /remind list").setRequired(true))),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "me") {
      const timeStr = interaction.options.getString("time", true);
      const message = interaction.options.getString("message", true);
      const secs = parseDuration(timeStr);
      if (!secs || secs < 10) {
        await interaction.reply({ content: "Invalid time. Try `30m`, `2h`, `1d` etc.", ephemeral: true });
        return;
      }
      if (secs > 30 * 86400) {
        await interaction.reply({ content: "Maximum reminder time is 30 days.", ephemeral: true });
        return;
      }
      const remindAt = Math.floor(Date.now() / 1000) + secs;
      const id = createReminder(interaction.user.id, interaction.channelId, interaction.guildId, message, remindAt);
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("⏰ Reminder Set")
        .addFields(
          { name: "Message", value: message },
          { name: "When", value: `<t:${remindAt}:R> (<t:${remindAt}:f>)`, inline: true },
          { name: "ID", value: `#${id}`, inline: true },
        ).setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (sub === "list") {
      const reminders = getUserReminders(interaction.user.id);
      if (reminders.length === 0) {
        await interaction.reply({ content: "You have no active reminders.", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Your Reminders")
        .setDescription(reminders.map(r => `**#${r.id}** — ${r.message.slice(0, 60)}\nDue: <t:${r.remind_at}:R>`).join("\n\n"))
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else {
      const id = interaction.options.getInteger("id", true);
      const deleted = deleteReminder(id, interaction.user.id);
      await interaction.reply({ content: deleted ? `Reminder #${id} cancelled.` : "Reminder not found or not yours.", ephemeral: true });
    }
  },
};

export default command;
