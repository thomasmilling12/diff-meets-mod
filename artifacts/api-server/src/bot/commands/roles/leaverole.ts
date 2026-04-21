import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../client";
import { isSelfRole } from "../../db/selfRoles";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("leave-role")
    .setDescription("Remove yourself from a self-assignable role")
    .addRoleOption(o => o.setName("role").setDescription("The role to leave").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const targetRole = interaction.options.getRole("role", true);
    const member = interaction.guild?.members.cache.get(interaction.user.id);

    if (!member) {
      await interaction.reply({ content: "Could not find your member data.", ephemeral: true });
      return;
    }

    if (!isSelfRole(guildId, targetRole.id)) {
      await interaction.reply({ content: `**${targetRole.name}** is not a self-assignable role.`, ephemeral: true });
      return;
    }

    if (!member.roles.cache.has(targetRole.id)) {
      await interaction.reply({ content: `You don't have the **${targetRole.name}** role.`, ephemeral: true });
      return;
    }

    try {
      await member.roles.remove(targetRole.id, "Self-removed role");
      await interaction.reply({ content: `Removed the **${targetRole.name}** role from you.`, ephemeral: true });
    } catch {
      await interaction.reply({ content: "Failed to remove the role. Make sure I have permission to manage roles.", ephemeral: true });
    }
  },
};

export default command;
