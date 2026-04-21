import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../client";
import { setAutoRole, getConfig } from "../../db/guildConfig";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("autorole")
    .setDescription("Set a role to auto-assign to new members")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(s => s.setName("set").setDescription("Set the auto-role")
      .addRoleOption(o => o.setName("role").setDescription("Role to assign").setRequired(true)))
    .addSubcommand(s => s.setName("disable").setDescription("Disable auto-role"))
    .addSubcommand(s => s.setName("status").setDescription("View current auto-role")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "set") {
      const role = interaction.options.getRole("role", true);
      const guildRole = interaction.guild?.roles.cache.get(role.id);
      if (guildRole && guildRole.position >= (interaction.guild?.members.me?.roles.highest.position ?? 0)) {
        await interaction.reply({ content: "I cannot assign a role higher than or equal to my highest role.", ephemeral: true });
        return;
      }
      setAutoRole(guildId, role.id);
      await interaction.reply({ content: `Auto-role set to **${role.name}**. New members will automatically receive this role.` });

    } else if (sub === "disable") {
      setAutoRole(guildId, null);
      await interaction.reply({ content: "Auto-role disabled." });

    } else {
      const config = getConfig(guildId);
      if (config.auto_role_id) {
        await interaction.reply({ content: `Current auto-role: <@&${config.auto_role_id}>` });
      } else {
        await interaction.reply({ content: "Auto-role is not configured." });
      }
    }
  },
};

export default command;
