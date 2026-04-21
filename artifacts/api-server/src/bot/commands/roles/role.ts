import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("role")
    .setDescription("Manage roles for a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a role to a member")
        .addUserOption((opt) => opt.setName("user").setDescription("The user").setRequired(true))
        .addRoleOption((opt) => opt.setName("role").setDescription("The role to add").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a role from a member")
        .addUserOption((opt) => opt.setName("user").setDescription("The user").setRequired(true))
        .addRoleOption((opt) => opt.setName("role").setDescription("The role to remove").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("info")
        .setDescription("View info about a role")
        .addRoleOption((opt) => opt.setName("role").setDescription("The role to inspect").setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "add" || sub === "remove") {
      const target = interaction.options.getUser("user", true);
      const role = interaction.options.getRole("role", true);
      const member = interaction.guild?.members.cache.get(target.id);

      if (!member) {
        await interaction.reply({ content: "Could not find that member.", ephemeral: true });
        return;
      }

      const guildRole = interaction.guild?.roles.cache.get(role.id);
      if (!guildRole) {
        await interaction.reply({ content: "Could not find that role.", ephemeral: true });
        return;
      }

      if (guildRole.position >= (interaction.guild?.members.me?.roles.highest.position ?? 0)) {
        await interaction.reply({ content: "I cannot manage a role that is higher than or equal to my highest role.", ephemeral: true });
        return;
      }

      try {
        if (sub === "add") {
          await member.roles.add(guildRole);
          await interaction.reply({ content: `Added role **${guildRole.name}** to **${target.tag}**.` });
        } else {
          await member.roles.remove(guildRole);
          await interaction.reply({ content: `Removed role **${guildRole.name}** from **${target.tag}**.` });
        }
      } catch {
        await interaction.reply({ content: "Failed to update roles. Check my permissions.", ephemeral: true });
      }

    } else if (sub === "info") {
      const role = interaction.options.getRole("role", true);
      const guildRole = interaction.guild?.roles.cache.get(role.id);
      if (!guildRole) {
        await interaction.reply({ content: "Could not find that role.", ephemeral: true });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(guildRole.color || 0x5865f2)
        .setTitle(`Role: ${guildRole.name}`)
        .addFields(
          { name: "ID", value: guildRole.id, inline: true },
          { name: "Color", value: guildRole.hexColor, inline: true },
          { name: "Position", value: `${guildRole.position}`, inline: true },
          { name: "Mentionable", value: guildRole.mentionable ? "Yes" : "No", inline: true },
          { name: "Hoisted", value: guildRole.hoist ? "Yes" : "No", inline: true },
          { name: "Members", value: `${guildRole.members.size}`, inline: true },
          { name: "Created", value: `<t:${Math.floor(guildRole.createdTimestamp / 1000)}:R>`, inline: true },
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
