import {
  SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder,
} from "discord.js";
import type { Command } from "../../client";
import { addSelfRole, removeSelfRole, getSelfRoles } from "../../db/selfRoles";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("self-role")
    .setDescription("Manage self-assignable roles")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(s => s.setName("add").setDescription("Allow members to self-assign a role")
      .addRoleOption(o => o.setName("role").setDescription("The role to make self-assignable").setRequired(true))
      .addStringOption(o => o.setName("description").setDescription("Short description shown in the list").setRequired(false)))
    .addSubcommand(s => s.setName("remove").setDescription("Remove a role from the self-assignable list")
      .addRoleOption(o => o.setName("role").setDescription("The role to remove").setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("List all self-assignable roles")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "add") {
      const role = interaction.options.getRole("role", true);
      const description = interaction.options.getString("description") ?? undefined;
      addSelfRole(guildId, role.id, description);
      await interaction.reply({ content: `**${role.name}** is now self-assignable. Members can use \`/join-role\` to get it.` });
    } else if (sub === "remove") {
      const role = interaction.options.getRole("role", true);
      const removed = removeSelfRole(guildId, role.id);
      await interaction.reply({
        content: removed
          ? `**${role.name}** removed from self-assignable roles.`
          : `**${role.name}** is not in the self-assignable list.`,
        ephemeral: !removed,
      });
    } else {
      const roles = getSelfRoles(guildId);
      if (roles.length === 0) {
        await interaction.reply({ content: "No self-assignable roles set. Use `/self-role add` to add some.", ephemeral: true });
        return;
      }
      const lines = roles.map(r => {
        const roleObj = interaction.guild?.roles.cache.get(r.role_id);
        const name = roleObj ? `<@&${r.role_id}>` : `Unknown (${r.role_id})`;
        return r.description ? `${name} — ${r.description}` : name;
      });
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Self-Assignable Roles")
        .setDescription(lines.join("\n"))
        .setFooter({ text: `${roles.length} role(s) • Use /join-role to get one` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
