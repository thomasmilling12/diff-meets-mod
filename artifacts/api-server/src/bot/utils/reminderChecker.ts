import { Client, EmbedBuilder } from "discord.js";
import { getDueReminders, markReminderSent } from "../db/reminders";
import { botLogger } from "../logger";

export function startReminderChecker(client: Client): void {
  setInterval(async () => {
    const due = getDueReminders();
    for (const reminder of due) {
      markReminderSent(reminder.id);
      try {
        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle("⏰ Reminder!")
          .setDescription(reminder.message)
          .setFooter({ text: `Reminder #${reminder.id}` })
          .setTimestamp();

        try {
          const user = await client.users.fetch(reminder.user_id);
          await user.send({ embeds: [embed] });
        } catch {
          const channel = client.channels.cache.get(reminder.channel_id);
          if (channel?.isTextBased() && "send" in channel) {
            await (channel as import("discord.js").TextChannel).send({ content: `<@${reminder.user_id}>`, embeds: [embed] });
          }
        }
      } catch (err) {
        botLogger.warn({ err, reminderId: reminder.id }, "Failed to send reminder");
      }
    }
  }, 20_000);
}
