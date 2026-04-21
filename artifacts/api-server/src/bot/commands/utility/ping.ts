import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../client";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check the bot's latency"),

  async execute(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.reply({ content: "Pinging...", fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const wsLatency = interaction.client.ws.ping;

    await interaction.editReply(
      `Pong!\nBot Latency: **${latency}ms**\nWebSocket Latency: **${wsLatency}ms**`
    );
  },
};

export default command;
