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
            "`/ban` — Ban a member (DMs them + creates case)",
            "`/unban` — Unban a user by ID",
            "`/tempban` — Temporarily ban (auto-unbans)",
            "`/kick` — Kick a member (DMs them + creates case)",
            "`/mute` — Timeout a member",
            "`/unmute` — Remove timeout",
            "`/warn` — Issue a warning",
            "`/warnings` — View/clear warnings",
            "`/purge` — Bulk delete messages",
            "`/lock` — Lock/unlock a channel",
            "`/slowmode` — Set channel slowmode",
            "`/note` — Add private mod notes to users",
            "`/case` — View mod case history",
          ].join("\n"),
        },
        {
          name: "Auto-Mod",
          value: [
            "`/automod setup` — Configure auto-mod",
            "`/automod status` — View current config",
            "`/wordfilter add/remove/list` — Manage word filter",
          ].join("\n"),
        },
        {
          name: "Logging & Config",
          value: [
            "`/log setchannel` — Set log channel",
            "`/log disable` — Disable logging",
            "`/welcome set` — Set welcome messages",
            "`/autorole set` — Auto-assign role on join",
            "`/buttonroles add/post` — Self-assign role buttons",
            "`/customcmd add/remove/list` — Custom commands",
          ].join("\n"),
        },
        {
          name: "Role Management",
          value: [
            "`/role add` — Add a role to a member",
            "`/role remove` — Remove a role",
            "`/role info` — View role info",
          ].join("\n"),
        },
        {
          name: "Utility",
          value: [
            "`/announce` — Send a formatted announcement",
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
