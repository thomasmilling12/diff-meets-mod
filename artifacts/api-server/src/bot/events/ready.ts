import { Client } from "discord.js";
import { botLogger } from "../logger";
import { startStatusRotator } from "../utils/statusRotator";
import { applyPresence } from "../utils/presenceManager";
import { getPresence } from "../db/botPresence";

export function registerReadyEvent(client: Client): void {
  client.once("clientReady", (c) => {
    botLogger.info(`Logged in as ${c.user.tag}`);
    const customPresence = getPresence();
    if (customPresence) {
      applyPresence(c);
    } else {
      startStatusRotator(c);
    }
  });
}
