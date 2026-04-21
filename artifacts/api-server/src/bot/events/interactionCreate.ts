import { Client, Events, Interaction } from "discord.js";
import { commands } from "../client";
import { botLogger } from "../logger";

export function registerInteractionCreateEvent(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      botLogger.error({ err, command: interaction.commandName }, "Error executing command");
      const msg = { content: "An error occurred while running this command.", ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg).catch(() => {});
      } else {
        await interaction.reply(msg).catch(() => {});
      }
    }
  });
}
