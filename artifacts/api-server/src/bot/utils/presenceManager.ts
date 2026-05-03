import { Client, ActivityType } from "discord.js";
import { getPresence } from "../db/botPresence";
import { botLogger } from "../logger";

const ACTIVITY_TYPE_MAP: Record<string, ActivityType> = {
  Playing: ActivityType.Playing,
  Watching: ActivityType.Watching,
  Listening: ActivityType.Listening,
  Competing: ActivityType.Competing,
};

export function applyPresence(client: Client): void {
  try {
    const p = getPresence();
    if (!p) {
      client.user?.setPresence({ activities: [{ name: "over the server", type: ActivityType.Watching }], status: "online" });
      return;
    }
    const type = ACTIVITY_TYPE_MAP[p.activity_type] ?? ActivityType.Watching;
    const status = p.status as "online" | "idle" | "dnd";
    client.user?.setPresence({ activities: [{ name: p.activity_text, type }], status });
  } catch (err) {
    botLogger.warn({ err }, "Failed to apply presence");
  }
}
