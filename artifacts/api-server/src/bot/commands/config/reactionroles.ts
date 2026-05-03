import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { addReactionRole, removeReactionRole, getReactionRolesByGuild } from "../../db/reactionRoles";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("reaction-roles")
    .setDescription("Assign roles via emoji reactions on a message")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("add").setDescription("Link an emoji reaction to a role")
      .addStringOption(o => o.setName("message_id").setDescription("Message ID to watch").setRequired(true))
      .addStringOption(o => o.setName("emoji").setDescription("Emoji (e.g. ✅ or a custom emoji)").setRequired(true))
      .addRoleOption(o => o.setName("role").setDescription("Role to assign").setRequired(true))
      .addChannelOption(o => o.setName("channel").setDescription("Channel the message is in (default: current)").setRequired(false)))
    .addSubcommand(s => s.setName("remove").setDescription("Remove a reaction role")
      .addStringOption(o => o.setName("message_id").setDescription("Message ID").setRequired(true))
      .addStringOption(o => o.setName("emoji").setDescription("Emoji to remove").setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("List all reaction roles")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "add") {
      const messageId = interaction.options.getString("message_id", true);
      const emoji = interaction.options.getString("emoji", true);
      const role = interaction.options.getRole("role", true);
      const channel = interaction.options.getChannel("channel") ?? interaction.channel;

      if (role.managed || role.id === interaction.guild?.id) {
        await interaction.reply({ content: "That role cannot be assigned.", ephemeral: true });
        return;
      }

      addReactionRole(guildId, channel!.id, messageId, emoji, role.id);
      await interaction.reply({ content: `Reaction role set: ${emoji} on message \`${messageId}\` → <@&${role.id}>.\n\nReact to the message with ${emoji} to test it.` });

    } else if (sub === "remove") {
      const messageId = interaction.options.getString("message_id", true);
      const emoji = interaction.options.getString("emoji", true);
      const removed = removeReactionRole(guildId, messageId, emoji);
      await interaction.reply({ content: removed ? `Reaction role for ${emoji} removed.` : "Reaction role not found.", ephemeral: !removed });

    } else {
      const roles = getReactionRolesByGuild(guildId);
      if (roles.length === 0) {
        await interaction.reply({ content: "No reaction roles configured.", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Reaction Roles")
        .setDescription(roles.map(r => `${r.emoji} on \`${r.message_id}\` in <#${r.channel_id}> → <@&${r.role_id}>`).join("\n"))
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
