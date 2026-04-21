import { Client, Events, Interaction } from "discord.js";
import { commands } from "../client";
import { findByMessageId } from "../db/buttonRoles";
import { botLogger } from "../logger";

export function registerInteractionCreateEvent(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        botLogger.error({ err, command: interaction.commandName }, "Error executing command");
        const msg = { content: "An error occurred while running this command.", ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg).catch(() => {});
        } else {
          await interaction.reply(msg).catch(() => {});
        }
      }
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith("role_toggle_")) {
      const roleId = interaction.customId.replace("role_toggle_", "");
      const guildId = interaction.guildId;
      if (!guildId || !interaction.guild) return;

      const buttonRoles = findByMessageId(interaction.message.id);
      const buttonRole = buttonRoles.find(r => r.role_id === roleId);
      if (!buttonRole) return;

      const member = interaction.guild.members.cache.get(interaction.user.id);
      if (!member) return;

      const role = interaction.guild.roles.cache.get(roleId);
      if (!role) {
        await interaction.reply({ content: "That role no longer exists.", ephemeral: true });
        return;
      }

      try {
        if (member.roles.cache.has(roleId)) {
          await member.roles.remove(role);
          await interaction.reply({ content: `Removed role **${role.name}**.`, ephemeral: true });
        } else {
          await member.roles.add(role);
          await interaction.reply({ content: `Added role **${role.name}**.`, ephemeral: true });
        }
      } catch {
        await interaction.reply({ content: "Failed to update your role. Please contact a moderator.", ephemeral: true });
      }
    }
  });
}
