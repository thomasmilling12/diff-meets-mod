import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { addTempRole, getActiveTempRoles } from "../../db/tempRoles";

function parseDuration(str: string): number | null {
  const parts = str.match(/(\d+)\s*(s|sec|m|min|h|hr|d|day)s?/gi);
  if (!parts) return null;
  let total = 0;
  const mul: Record<string, number> = { s: 1, sec: 1, m: 60, min: 60, h: 3600, hr: 3600, d: 86400, day: 86400 };
  for (const p of parts) {
    const m = p.match(/(\d+)\s*(\w+)/i);
    if (!m) continue;
    const unit = m[2].toLowerCase().replace(/s$/, "");
    total += parseInt(m[1]) * (mul[unit] ?? 0);
  }
  return total > 0 ? total : null;
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("temprole")
    .setDescription("Assign a role to a member for a limited time")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(s => s.setName("add").setDescription("Give a temporary role")
      .addUserOption(o => o.setName("user").setDescription("Member to give the role to").setRequired(true))
      .addRoleOption(o => o.setName("role").setDescription("Role to assign").setRequired(true))
      .addStringOption(o => o.setName("duration").setDescription("How long e.g. 2h, 1d, 30m").setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("List active temp roles for a user")
      .addUserOption(o => o.setName("user").setDescription("Member to check").setRequired(true))),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "add") {
      const target = interaction.options.getUser("user", true);
      const role = interaction.options.getRole("role", true);
      const durationStr = interaction.options.getString("duration", true);

      if (role.managed || role.id === interaction.guild?.id) {
        await interaction.reply({ content: "That role cannot be assigned.", ephemeral: true });
        return;
      }

      const secs = parseDuration(durationStr);
      if (!secs || secs < 30) {
        await interaction.reply({ content: "Invalid duration. Try `30m`, `2h`, `1d`.", ephemeral: true });
        return;
      }
      if (secs > 30 * 86400) {
        await interaction.reply({ content: "Maximum temp role duration is 30 days.", ephemeral: true });
        return;
      }

      const member = interaction.guild?.members.cache.get(target.id) ?? await interaction.guild?.members.fetch(target.id).catch(() => null);
      if (!member) { await interaction.reply({ content: "Member not found.", ephemeral: true }); return; }

      const guildRole = interaction.guild?.roles.cache.get(role.id);
      if (!guildRole) { await interaction.reply({ content: "Role not found.", ephemeral: true }); return; }

      await member.roles.add(guildRole, `Temp role by ${interaction.user.tag}`);
      const expiresAt = Math.floor(Date.now() / 1000) + secs;
      addTempRole(guildId, target.id, role.id, expiresAt, interaction.user.tag);

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("⏱️ Temp Role Assigned")
        .addFields(
          { name: "Member", value: `${target.tag}`, inline: true },
          { name: "Role", value: `<@&${role.id}>`, inline: true },
          { name: "Expires", value: `<t:${expiresAt}:R> (<t:${expiresAt}:f>)`, inline: false },
        ).setTimestamp();
      await interaction.reply({ embeds: [embed] });

    } else {
      const target = interaction.options.getUser("user", true);
      const active = getActiveTempRoles(guildId, target.id);
      if (active.length === 0) {
        await interaction.reply({ content: `${target.tag} has no active temp roles.`, ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`Temp Roles — ${target.tag}`)
        .setDescription(active.map(tr => `<@&${tr.role_id}> — expires <t:${tr.expires_at}:R>\nAssigned by ${tr.assigned_by_tag}`).join("\n\n"))
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

export default command;
