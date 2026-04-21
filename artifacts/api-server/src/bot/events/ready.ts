import { Client } from "discord.js";
import { botLogger } from "../logger";
import { startStatusRotator } from "../utils/statusRotator";

export function registerReadyEvent(client: Client): void {
  client.once("clientReady", (c) => {
    botLogger.info(`Logged in as ${c.user.tag}`);
    startStatusRotator(c);
  });
}
