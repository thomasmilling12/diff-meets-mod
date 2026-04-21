import { Client, Events, GuildMember, PartialGuildMember, TextChannel, EmbedBuilder } from "discord.js";
import { getConfig } from "../db/guildConfig";

export function registerGuildMemberUpdateEvent(client: Client): void {
  client.on(Events.GuildMemberUpdate, async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
    const config = getConfig(newMember.guild.id);
    if (!config.log_roles_channel_id) return;

    const logChannel = newMember.guild.channels.cache.get(config.log_roles_channel_id) as TextChannel | undefined;
    if (!logChannel) return;

    const oldRoles = oldMember.roles?.cache ?? new Map();
    const newRoles = newMember.roles.cache;

    const added = [...newRoles.values()].filter(r => !oldRoles.has(r.id) && r.id !== newMember.guild.id);
    const removed = [...oldRoles.values()].filter(r => !newRoles.has(r.id) && r.id !== newMember.guild.id);

    const nicknameChanged = oldMember.nickname !== newMember.nickname;

    if (added.length === 0 && removed.length === 0 && !nicknameChanged) return;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Member Updated")
      .addFields({ name: "User", value: `${newMember.user.tag} (${newMember.user.id})`, inline: true });

    if (added.length > 0) {
      embed.addFields({ name: "Roles Added", value: added.map(r => `<@&${r.id}>`).join(", ") });
    }
    if (removed.length > 0) {
      embed.addFields({ name: "Roles Removed", value: removed.map(r => `<@&${r.id}>`).join(", ") });
    }
    if (nicknameChanged) {
      embed.addFields(
        { name: "Old Nickname", value: oldMember.nickname ?? "*(none)*", inline: true },
        { name: "New Nickname", value: newMember.nickname ?? "*(none)*", inline: true },
      );
    }

    embed.setTimestamp();
    await logChannel.send({ embeds: [embed] }).catch(() => {});
  });
}
