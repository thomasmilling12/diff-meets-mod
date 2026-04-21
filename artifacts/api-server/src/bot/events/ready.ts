import { Client, Events } from "discord.js";
import { botLogger } from "../logger";

export function registerReadyEvent(client: Client): void {
  client.once(Events.ClientReady, (c) => {
    botLogger.info(`Logged in as ${c.user.tag}`);
    c.user.setActivity("Moderating | /help");
  });
}
