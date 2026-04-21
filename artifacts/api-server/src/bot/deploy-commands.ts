import { REST, Routes } from "discord.js";
import { commands } from "./client";
import { botLogger } from "./logger";

export async function deployCommands(clientId: string): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN is not set");

  const rest = new REST().setToken(token);
  const commandData = Array.from(commands.values()).map((c) => c.data.toJSON());

  botLogger.info(`Deploying ${commandData.length} slash commands globally...`);

  await rest.put(Routes.applicationCommands(clientId), { body: commandData });

  botLogger.info("Successfully deployed slash commands.");
}
