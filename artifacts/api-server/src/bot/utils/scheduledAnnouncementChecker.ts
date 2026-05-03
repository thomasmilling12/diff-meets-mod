import { Client, TextChannel } from "discord.js";
import { getDueAnnouncements, markAnnouncementSent } from "../db/scheduledAnnouncements";
import { botLogger } from "../logger";

export function startScheduledAnnouncementChecker(client: Client): void {
  setInterval(async () => {
    const due = getDueAnnouncements();
    for (const ann of due) {
      markAnnouncementSent(ann.id);
      try {
        const guild = client.guilds.cache.get(ann.guild_id);
        if (!guild) continue;
        const channel = guild.channels.cache.get(ann.channel_id) as TextChannel | undefined;
        if (!channel) continue;
        await channel.send(ann.message);
      } catch (err) {
        botLogger.warn({ err, announcementId: ann.id }, "Failed to send scheduled announcement");
      }
    }
  }, 20_000);
}
