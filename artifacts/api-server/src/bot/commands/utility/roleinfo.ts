import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Role, PermissionFlagsBits } from "discord.js";
import type { Command } from "../../client";

const KEY_PERMS: [bigint, string][] = [
  [PermissionFlagsBits.Administrator, "Administrator"],
  [PermissionFlagsBits.ManageGuild, "Manage Server"],
  [PermissionFlagsBits.ManageRoles, "Manage Roles"],
  [PermissionFlagsBits.ManageChannels, "Manage Channels"],
  [PermissionFlagsBits.BanMembers, "Ban Members"],
  [PermissionFlagsBits.KickMembers, "Kick Members"],
  [PermissionFlagsBits.ModerateMembers, "Timeout Members"],
  [PermissionFlagsBits.ManageMessages, "Manage Messages"],
  [PermissionFlagsBits.MentionEveryone, "Mention Everyone"],
  [PermissionFlagsBits.ManageWebhooks, "Manage Webhooks"],
];

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("roleinfo")
    .setDescription("Show detailed information about a role")
    .addRoleOption(o => o.setName("role").setDescription("Role to inspect").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const role = interaction.options.getRole("role", true) as Role;
    const guild = interaction.guild!;
    const memberCount = guild.members.cache.filter(m => m.roles.cache.has(role.id)).size;
    const colorHex = role.hexColor === "#000000" ? "Default" : role.hexColor;

    const keyPerms = KEY_PERMS
      .filter(([flag]) => role.permissions.has(flag))
      .map(([, name]) => name);

    const embed = new EmbedBuilder()
      .setColor(role.color || 0x5865f2)
      .setTitle(`Role Info — ${role.name}`)
      .addFields(
        { name: "ID", value: role.id, inline: true },
        { name: "Color", value: colorHex, inline: true },
        { name: "Members", value: `${memberCount}`, inline: true },
        { name: "Position", value: `${role.position} of ${guild.roles.cache.size}`, inline: true },
        { name: "Hoisted", value: role.hoist ? "Yes" : "No", inline: true },
        { name: "Mentionable", value: role.mentionable ? "Yes" : "No", inline: true },
        { name: "Managed (Bot/Integration)", value: role.managed ? "Yes" : "No", inline: true },
        { name: "Created", value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "Key Permissions", value: keyPerms.length > 0 ? keyPerms.join(", ") : "None" },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
