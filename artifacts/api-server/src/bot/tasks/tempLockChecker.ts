import { Client, TextChannel, PermissionsBitField } from "discord.js";
import { getExpiredTempLocks, removeTempLock } from "../db/templocks";
import { botLogger } from "../logger";

export function startTempLockChecker(client: Client): void {
  setInterval(async () => {
    const expired = getExpiredTempLocks();
    for (const lock of expired) {
      try {
        const guild = client.guilds.cache.get(lock.guild_id);
        if (!guild) { removeTempLock(lock.guild_id, lock.channel_id); continue; }

        const channel = guild.channels.cache.get(lock.channel_id) as TextChannel | undefined;
        if (!channel) { removeTempLock(lock.guild_id, lock.channel_id); continue; }

        await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null }, { reason: "Templock expired — auto-unlock" });
        removeTempLock(lock.guild_id, lock.channel_id);

        await channel.send("🔓 This channel has been automatically unlocked.").catch(() => {});
      } catch (err) {
        botLogger.warn({ err, channelId: lock.channel_id }, "Failed to auto-unlock channel");
        removeTempLock(lock.guild_id, lock.channel_id);
      }
    }
  }, 15_000);
}
