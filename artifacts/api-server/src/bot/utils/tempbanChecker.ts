import { Client } from "discord.js";
import { getExpiredTempBans, deactivateCase } from "../db/cases";
import { botLogger } from "../logger";

export function startTempBanChecker(client: Client): void {
  const check = async () => {
    const expired = getExpiredTempBans();
    for (const c of expired) {
      try {
        const guild = client.guilds.cache.get(c.guild_id);
        if (!guild) continue;
        await guild.members.unban(c.user_id, "Temporary ban expired");
        deactivateCase(c.guild_id, c.case_number);
        botLogger.info({ userId: c.user_id, guildId: c.guild_id }, "Temp ban expired, user unbanned");
      } catch (err) {
        botLogger.warn({ err, case: c.case_number }, "Failed to unban temp-banned user");
        deactivateCase(c.guild_id, c.case_number);
      }
    }
  };

  setInterval(check, 60_000);
  check().catch(() => {});
}
