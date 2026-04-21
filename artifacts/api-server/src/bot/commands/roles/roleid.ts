import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Role } from "discord.js";
import type { Command } from "../../client";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("role-id")
    .setDescription("Get the ID of a role")
    .addRoleOption(o => o.setName("role").setDescription("The role to look up").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const role = interaction.options.getRole("role", true);
    const embed = new EmbedBuilder()
      .setColor(role.color || 0x5865f2)
      .setTitle("Role ID")
      .addFields(
        { name: "Role", value: `<@&${role.id}>`, inline: true },
        { name: "ID", value: `\`${role.id}\``, inline: true },
        { name: "Color", value: role instanceof Role ? role.hexColor : "N/A", inline: true },
        { name: "Mentionable", value: role.mentionable ? "Yes" : "No", inline: true },
        { name: "Hoisted", value: role.hoist ? "Yes" : "No", inline: true },
        { name: "Position", value: `${role.position}`, inline: true },
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
