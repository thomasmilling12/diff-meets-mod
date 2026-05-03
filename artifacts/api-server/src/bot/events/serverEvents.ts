import { Client, Events, GuildChannel, TextChannel, EmbedBuilder, Role } from "discord.js";
import { getConfig } from "../db/guildConfig";

function getServerLogChannel(guildId: string, guild: import("discord.js").Guild): TextChannel | undefined {
  const config = getConfig(guildId);
  const id = (config as unknown as Record<string, string>).log_server_channel_id ?? config.log_channel_id;
  if (!id) return undefined;
  return guild.channels.cache.get(id) as TextChannel | undefined;
}

export function registerServerEvents(client: Client): void {
  // ── Channel Create ────────────────────────────────────────────────────────
  client.on(Events.ChannelCreate, async (channel: GuildChannel) => {
    const logChannel = getServerLogChannel(channel.guild.id, channel.guild);
    if (!logChannel) return;
    const embed = new EmbedBuilder().setColor(0x00cc66).setTitle("Channel Created")
      .addFields(
        { name: "Name", value: `<#${channel.id}> \`${channel.name}\``, inline: true },
        { name: "Type", value: channel.type.toString(), inline: true },
      ).setTimestamp();
    await logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // ── Channel Delete ────────────────────────────────────────────────────────
  client.on(Events.ChannelDelete, async (channel) => {
    if (!("guild" in channel) || !channel.guild) return;
    const logChannel = getServerLogChannel(channel.guild.id, channel.guild);
    if (!logChannel) return;
    const embed = new EmbedBuilder().setColor(0xff4444).setTitle("Channel Deleted")
      .addFields({ name: "Name", value: `\`${channel.name}\``, inline: true }).setTimestamp();
    await logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // ── Channel Update ────────────────────────────────────────────────────────
  client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
    if (!("guild" in newChannel) || !newChannel.guild) return;
    const logChannel = getServerLogChannel(newChannel.guild.id, newChannel.guild);
    if (!logChannel) return;
    if (!("name" in oldChannel) || !("name" in newChannel)) return;
    if (oldChannel.name === newChannel.name) return;
    const embed = new EmbedBuilder().setColor(0xffa500).setTitle("Channel Renamed")
      .addFields(
        { name: "Before", value: `\`${oldChannel.name}\``, inline: true },
        { name: "After", value: `\`${newChannel.name}\``, inline: true },
      ).setTimestamp();
    await logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // ── Role Create ───────────────────────────────────────────────────────────
  client.on(Events.GuildRoleCreate, async (role: Role) => {
    const logChannel = getServerLogChannel(role.guild.id, role.guild);
    if (!logChannel) return;
    const embed = new EmbedBuilder().setColor(role.color || 0x00cc66).setTitle("Role Created")
      .addFields(
        { name: "Name", value: `<@&${role.id}> \`${role.name}\``, inline: true },
        { name: "Color", value: role.hexColor, inline: true },
      ).setTimestamp();
    await logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // ── Role Delete ───────────────────────────────────────────────────────────
  client.on(Events.GuildRoleDelete, async (role: Role) => {
    const logChannel = getServerLogChannel(role.guild.id, role.guild);
    if (!logChannel) return;
    const embed = new EmbedBuilder().setColor(0xff4444).setTitle("Role Deleted")
      .addFields({ name: "Name", value: `\`${role.name}\``, inline: true }).setTimestamp();
    await logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // ── Role Update ───────────────────────────────────────────────────────────
  client.on(Events.GuildRoleUpdate, async (oldRole: Role, newRole: Role) => {
    if (oldRole.name === newRole.name && oldRole.color === newRole.color) return;
    const logChannel = getServerLogChannel(newRole.guild.id, newRole.guild);
    if (!logChannel) return;
    const embed = new EmbedBuilder().setColor(0xffa500).setTitle("Role Updated")
      .addFields({ name: "Role", value: `<@&${newRole.id}>`, inline: true });
    if (oldRole.name !== newRole.name) {
      embed.addFields(
        { name: "Old Name", value: `\`${oldRole.name}\``, inline: true },
        { name: "New Name", value: `\`${newRole.name}\``, inline: true },
      );
    }
    if (oldRole.color !== newRole.color) {
      embed.addFields(
        { name: "Old Color", value: oldRole.hexColor, inline: true },
        { name: "New Color", value: newRole.hexColor, inline: true },
      );
    }
    embed.setTimestamp();
    await logChannel.send({ embeds: [embed] }).catch(() => {});
  });
}
