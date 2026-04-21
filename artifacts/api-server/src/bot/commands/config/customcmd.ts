import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { addCustomCommand, removeCustomCommand, getCustomCommands } from "../../db/customCommands";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("customcmd")
    .setDescription("Manage custom text commands")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("add").setDescription("Add a custom command")
      .addStringOption(o => o.setName("trigger").setDescription("The command trigger (e.g. !rules)").setRequired(true))
      .addStringOption(o => o.setName("response").setDescription("The response text").setRequired(true)))
    .addSubcommand(s => s.setName("remove").setDescription("Remove a custom command")
      .addStringOption(o => o.setName("trigger").setDescription("The command trigger to remove").setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("List all custom commands")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "add") {
      const trigger = interaction.options.getString("trigger", true).toLowerCase().trim();
      const response = interaction.options.getString("response", true);
      addCustomCommand(guildId, trigger, response);
      await interaction.reply({ content: `Custom command \`${trigger}\` added.` });
    } else if (sub === "remove") {
      const trigger = interaction.options.getString("trigger", true).toLowerCase().trim();
      const removed = removeCustomCommand(guildId, trigger);
      await interaction.reply({ content: removed ? `Custom command \`${trigger}\` removed.` : `No custom command found with trigger \`${trigger}\`.`, ephemeral: !removed });
    } else {
      const cmds = getCustomCommands(guildId);
      if (cmds.length === 0) {
        await interaction.reply({ content: "No custom commands yet. Use `/customcmd add` to create one.", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Custom Commands")
        .setDescription(cmds.map(c => `**${c.trigger}** — ${c.response}`).join("\n"))
        .setFooter({ text: `${cmds.length} command(s)` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
