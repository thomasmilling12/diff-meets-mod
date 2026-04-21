import { Client, Guild } from "discord.js";
import { getEscalationForCount } from "../db/escalation";
import { createCase } from "../db/cases";
import { sendModLog } from "./modLog";
import { botLogger } from "../logger";

export async function handleEscalation(
  client: Client,
  guildId: string,
  userId: string,
  userTag: string,
  warningCount: number,
  guild: Guild,
): Promise<string | null> {
  const rule = getEscalationForCount(guildId, warningCount);
  if (!rule) return null;

  const member = guild.members.cache.get(userId);
  const BOT_TAG = client.user?.tag ?? "Auto-Mod";
  const reason = `Auto-escalation: reached ${warningCount} warnings`;

  try {
    if (rule.action === "MUTE" && member?.moderatable) {
      const duration = rule.duration ?? 60;
      await member.timeout(duration * 60 * 1000, reason);
      createCase({
        guildId, action: "MUTE", userId, userTag,
        moderatorId: client.user?.id ?? "0", moderatorTag: BOT_TAG, reason,
      });
      await sendModLog(client, guildId, "MUTE", userId, BOT_TAG, reason, {
        "Duration": `${duration}m`, "Trigger": `${warningCount} warnings`,
      });
      return `Auto-muted for ${duration} minutes (${warningCount} warnings)`;

    } else if (rule.action === "KICK" && member?.kickable) {
      try { await member.user.send(`You have been **kicked** from **${guild.name}**.\nReason: ${reason}`); } catch {}
      await member.kick(reason);
      createCase({
        guildId, action: "KICK", userId, userTag,
        moderatorId: client.user?.id ?? "0", moderatorTag: BOT_TAG, reason,
      });
      await sendModLog(client, guildId, "KICK", userId, BOT_TAG, reason, { "Trigger": `${warningCount} warnings` });
      return `Auto-kicked (${warningCount} warnings)`;

    } else if (rule.action === "BAN") {
      try { await guild.members.ban(userId, { reason }); } catch {}
      createCase({
        guildId, action: "BAN", userId, userTag,
        moderatorId: client.user?.id ?? "0", moderatorTag: BOT_TAG, reason,
      });
      await sendModLog(client, guildId, "BAN", userId, BOT_TAG, reason, { "Trigger": `${warningCount} warnings` });
      return `Auto-banned (${warningCount} warnings)`;
    }
  } catch (err) {
    botLogger.warn({ err }, "Escalation action failed");
  }
  return null;
}
