import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all available commands"),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("DIFF Meets Mod — Command Help")
      .setDescription("Here are all available commands:")
      .addFields(
        {
          name: "Moderation",
          value: [
            "`/ban` — Ban a member",
            "`/unban` — Unban a user by ID",
            "`/kick` — Kick a member",
            "`/mute` — Timeout a member",
            "`/unmute` — Remove timeout",
            "`/warn` — Issue a warning",
            "`/warnings` — View/clear warnings",
            "`/purge` — Bulk delete messages",
          ].join("\n"),
        },
        {
          name: "Auto-Mod",
          value: [
            "`/automod setup` — Configure auto-mod settings",
            "`/automod status` — View current auto-mod config",
          ].join("\n"),
        },
        {
          name: "Logging",
          value: [
            "`/log setchannel` — Set the log channel",
            "`/log disable` — Disable logging",
          ].join("\n"),
        },
        {
          name: "Role Management",
          value: [
            "`/role add` — Add a role to a member",
            "`/role remove` — Remove a role from a member",
            "`/role info` — View role information",
          ].join("\n"),
        },
        {
          name: "Custom Commands",
          value: [
            "`/customcmd add` — Create a custom command",
            "`/customcmd remove` — Delete a custom command",
            "`/customcmd list` — List all custom commands",
          ].join("\n"),
        },
        {
          name: "Utility",
          value: [
            "`/ping` — Check bot latency",
            "`/userinfo` — View user information",
            "`/serverinfo` — View server information",
            "`/help` — Show this message",
          ].join("\n"),
        },
      )
      .setFooter({ text: "DIFF Meets Mod" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

export default command;
