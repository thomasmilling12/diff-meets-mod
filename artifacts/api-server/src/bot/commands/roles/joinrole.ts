import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { getSelfRoles, isSelfRole } from "../../db/selfRoles";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("join-role")
    .setDescription("Give yourself a self-assignable role")
    .addRoleOption(o => o.setName("role").setDescription("The role to join").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) {
      await interaction.reply({ content: "Could not find your member data.", ephemeral: true });
      return;
    }

    const targetRole = interaction.options.getRole("role");

    if (!targetRole) {
      const roles = getSelfRoles(guildId);
      if (roles.length === 0) {
        await interaction.reply({ content: "There are no self-assignable roles in this server.", ephemeral: true });
        return;
      }
      const lines = roles.map(r => {
        const roleObj = interaction.guild?.roles.cache.get(r.role_id);
        const name = roleObj ? `<@&${r.role_id}>` : `Unknown (${r.role_id})`;
        return r.description ? `${name} — ${r.description}` : name;
      });
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Available Self-Assignable Roles")
        .setDescription(lines.join("\n"))
        .setFooter({ text: "Use /join-role <role> to get one" })
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (!isSelfRole(guildId, targetRole.id)) {
      await interaction.reply({ content: `**${targetRole.name}** is not self-assignable. Use \`/join-role\` with no arguments to see available roles.`, ephemeral: true });
      return;
    }

    if (member.roles.cache.has(targetRole.id)) {
      await interaction.reply({ content: `You already have **${targetRole.name}**. Use \`/leave-role\` to remove it.`, ephemeral: true });
      return;
    }

    try {
      await member.roles.add(targetRole.id, "Self-assigned role");
      await interaction.reply({ content: `You now have the **${targetRole.name}** role!`, ephemeral: true });
    } catch {
      await interaction.reply({ content: "Failed to assign the role. Make sure I have permission to manage roles.", ephemeral: true });
    }
  },
};

export default command;
