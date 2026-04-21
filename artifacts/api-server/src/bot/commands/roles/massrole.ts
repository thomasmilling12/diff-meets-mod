import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../client";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("mass-role")
    .setDescription("Add or remove a role from all members in the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(o =>
      o.setName("action").setDescription("Add or remove the role").setRequired(true)
        .addChoices({ name: "add", value: "add" }, { name: "remove", value: "remove" }))
    .addRoleOption(o => o.setName("role").setDescription("The role to add or remove").setRequired(true))
    .addRoleOption(o => o.setName("filter_role").setDescription("Only apply to members with this role").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const action = interaction.options.getString("action", true) as "add" | "remove";
    const role = interaction.options.getRole("role", true);
    const filterRole = interaction.options.getRole("filter_role");

    if (role.managed || role.id === interaction.guildId) {
      await interaction.reply({ content: "I cannot assign that role (it's managed by an integration or is @everyone).", ephemeral: true });
      return;
    }

    await interaction.deferReply();

    try {
      await interaction.guild?.members.fetch();
      let members = [...(interaction.guild?.members.cache.values() ?? [])].filter(m => !m.user.bot);
      if (filterRole) {
        members = members.filter(m => m.roles.cache.has(filterRole.id));
      }

      let success = 0;
      let failed = 0;

      for (const member of members) {
        try {
          if (action === "add" && !member.roles.cache.has(role.id)) {
            await member.roles.add(role.id);
            success++;
          } else if (action === "remove" && member.roles.cache.has(role.id)) {
            await member.roles.remove(role.id);
            success++;
          }
        } catch {
          failed++;
        }
        await new Promise(r => setTimeout(r, 200));
      }

      const filterText = filterRole ? ` (filtered to members with <@&${filterRole.id}>)` : "";
      await interaction.editReply({
        content: `Mass-role complete${filterText}.\n**${action === "add" ? "Added" : "Removed"}** <@&${role.id}> — Success: ${success}, Failed: ${failed}`,
      });
    } catch (err) {
      await interaction.editReply({ content: "Failed to complete mass-role operation." });
    }
  },
};

export default command;
