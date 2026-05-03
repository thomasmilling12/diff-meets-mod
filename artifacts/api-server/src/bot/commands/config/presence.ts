import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ActivityType } from "discord.js";
import type { Command } from "../../client";
import { setPresence, clearPresence, getPresence } from "../../db/botPresence";
import { applyPresence } from "../../utils/presenceManager";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("presence")
    .setDescription("Configure the bot's status and activity")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("set").setDescription("Set the bot's presence")
      .addStringOption(o => o.setName("activity").setDescription("Activity text").setRequired(true).setMaxLength(128))
      .addStringOption(o => o.setName("type").setDescription("Activity type").setRequired(false)
        .addChoices(
          { name: "Playing", value: "Playing" },
          { name: "Watching", value: "Watching" },
          { name: "Listening to", value: "Listening" },
          { name: "Competing in", value: "Competing" },
        ))
      .addStringOption(o => o.setName("status").setDescription("Online status").setRequired(false)
        .addChoices(
          { name: "Online", value: "online" },
          { name: "Idle", value: "idle" },
          { name: "Do Not Disturb", value: "dnd" },
        )))
    .addSubcommand(s => s.setName("clear").setDescription("Reset to default presence"))
    .addSubcommand(s => s.setName("status").setDescription("Show current presence setting")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "set") {
      const activity = interaction.options.getString("activity", true);
      const type = interaction.options.getString("type") ?? "Watching";
      const status = interaction.options.getString("status") ?? "online";
      setPresence(type, activity, status);
      applyPresence(interaction.client);
      await interaction.reply({ content: `Bot presence set to **${type} ${activity}** (${status}).` });

    } else if (sub === "clear") {
      clearPresence();
      interaction.client.user?.setPresence({ activities: [], status: "online" });
      await interaction.reply({ content: "Bot presence reset to default." });

    } else {
      const p = getPresence();
      await interaction.reply({
        content: p
          ? `Current presence: **${p.activity_type} ${p.activity_text}** — Status: ${p.status}`
          : "No custom presence set (using default).",
        ephemeral: true,
      });
    }
  },
};

export default command;
