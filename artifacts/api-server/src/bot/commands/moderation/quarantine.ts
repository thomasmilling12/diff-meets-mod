import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { getQuarantineRole, setQuarantineRole, addQuarantinedUser, removeQuarantinedUser, isQuarantined } from "../../db/quarantine";
import { saveRoles, getSavedRoles, clearSavedRoles } from "../../db/rolePersistence";
import { createCase } from "../../db/cases";
import { sendModLog } from "../../utils/modLog";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("quarantine")
    .setDescription("Isolate a suspicious user by removing all their roles")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(s => s.setName("user").setDescription("Quarantine a member")
      .addUserOption(o => o.setName("user").setDescription("Member to quarantine").setRequired(true))
      .addStringOption(o => o.setName("reason").setDescription("Reason for quarantine").setRequired(false)))
    .addSubcommand(s => s.setName("release").setDescription("Release a member from quarantine and restore their roles")
      .addUserOption(o => o.setName("user").setDescription("Member to release").setRequired(true)))
    .addSubcommand(s => s.setName("setup").setDescription("Set the quarantine role (applied to isolated users)")
      .addRoleOption(o => o.setName("role").setDescription("Quarantine role").setRequired(true))),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "setup") {
      const role = interaction.options.getRole("role", true);
      setQuarantineRole(guildId, role.id);
      await interaction.reply({ content: `Quarantine role set to <@&${role.id}>. Members quarantined with \`/quarantine user\` will have all other roles removed and this role applied.` });
      return;
    }

    if (sub === "user") {
      const target = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason") ?? "Quarantined by moderator";
      const quarantineRoleId = getQuarantineRole(guildId);
      if (!quarantineRoleId) {
        await interaction.reply({ content: "No quarantine role configured. Run `/quarantine setup` first.", ephemeral: true });
        return;
      }
      const member = interaction.guild?.members.cache.get(target.id) ?? await interaction.guild?.members.fetch(target.id).catch(() => null);
      if (!member) { await interaction.reply({ content: "Member not found.", ephemeral: true }); return; }
      if (!member.manageable) { await interaction.reply({ content: "I cannot manage this member.", ephemeral: true }); return; }
      if (isQuarantined(guildId, target.id)) { await interaction.reply({ content: "That user is already quarantined.", ephemeral: true }); return; }

      const roleIds = member.roles.cache.filter(r => !r.managed && r.id !== guildId).map(r => r.id);
      saveRoles(guildId, target.id, roleIds);

      await member.roles.set([quarantineRoleId], `Quarantine: ${reason}`);
      addQuarantinedUser(guildId, target.id, reason, interaction.user.tag);

      const caseNum = createCase({ guildId, action: "QUARANTINE", userId: target.id, userTag: target.tag, moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, reason });

      try {
        await target.send({ embeds: [new EmbedBuilder().setColor(0xff4444).setTitle(`🔒 Quarantined in ${interaction.guild?.name}`)
          .addFields({ name: "Reason", value: reason }, { name: "Moderator", value: interaction.user.tag, inline: true })
          .setTimestamp()] });
      } catch { /* DMs closed */ }

      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xff4444).setTitle("🔒 User Quarantined")
          .addFields(
            { name: "User", value: `${target.tag} (${target.id})`, inline: true },
            { name: "Roles Saved", value: `${roleIds.length}`, inline: true },
            { name: "Reason", value: reason },
            { name: "Case", value: `#${caseNum}`, inline: true },
          ).setTimestamp()],
      });
      await sendModLog(interaction.client, guildId, "QUARANTINE", target, interaction.user.tag, reason);

    } else {
      const target = interaction.options.getUser("user", true);
      if (!isQuarantined(guildId, target.id)) { await interaction.reply({ content: "That user is not currently quarantined.", ephemeral: true }); return; }

      const member = interaction.guild?.members.cache.get(target.id) ?? await interaction.guild?.members.fetch(target.id).catch(() => null);
      if (!member) { await interaction.reply({ content: "Member not found — they may have left the server.", ephemeral: true }); return; }

      const savedRoles = getSavedRoles(guildId, target.id);
      clearSavedRoles(guildId, target.id);
      removeQuarantinedUser(guildId, target.id);

      const validRoles = savedRoles.filter(id => interaction.guild?.roles.cache.has(id));
      if (validRoles.length > 0) {
        await member.roles.set(validRoles, `Quarantine released by ${interaction.user.tag}`).catch(() => {});
      }

      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x00cc66).setTitle("🔓 User Released from Quarantine")
          .addFields(
            { name: "User", value: `${target.tag}`, inline: true },
            { name: "Roles Restored", value: `${validRoles.length}`, inline: true },
            { name: "Released By", value: interaction.user.tag, inline: true },
          ).setTimestamp()],
      });
    }
  },
};

export default command;
