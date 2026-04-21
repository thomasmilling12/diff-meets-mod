import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, TextChannel } from "discord.js";
import type { Command } from "../../client";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Set slowmode for this channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(o =>
      o.setName("seconds").setDescription("Seconds between messages (0 to disable)").setMinValue(0).setMaxValue(21600).setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const seconds = interaction.options.getInteger("seconds", true);
    const channel = interaction.channel as TextChannel;

    try {
      await channel.setRateLimitPerUser(seconds);
      if (seconds === 0) {
        await interaction.reply({ content: "Slowmode disabled." });
      } else {
        await interaction.reply({ content: `Slowmode set to **${seconds} second(s)**.` });
      }
    } catch {
      await interaction.reply({ content: "Failed to set slowmode.", ephemeral: true });
    }
  },
};

export default command;
