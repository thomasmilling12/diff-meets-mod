import { Client } from "discord.js";
import { getDueTempRoles, markTempRoleRemoved } from "../db/tempRoles";
import { botLogger } from "../logger";

export function startTempRoleChecker(client: Client): void {
  setInterval(async () => {
    const due = getDueTempRoles();
    for (const tr of due) {
      markTempRoleRemoved(tr.id);
      try {
        const guild = client.guilds.cache.get(tr.guild_id);
        if (!guild) continue;
        const member = guild.members.cache.get(tr.user_id) ?? await guild.members.fetch(tr.user_id).catch(() => null);
        if (!member) continue;
        const role = guild.roles.cache.get(tr.role_id);
        if (!role) continue;
        await member.roles.remove(role, "Temp role expired").catch(() => {});
      } catch (err) {
        botLogger.warn({ err, tempRoleId: tr.id }, "Failed to remove temp role");
      }
    }
  }, 15_000);
}
