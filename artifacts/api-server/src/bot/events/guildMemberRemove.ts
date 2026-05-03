import { Client, Events, GuildMember, PartialGuildMember, TextChannel, EmbedBuilder } from "discord.js";
import { getConfig } from "../db/guildConfig";
import { saveRoles } from "../db/rolePersistence";

export function registerGuildMemberRemoveEvent(client: Client): void {
  client.on(Events.GuildMemberRemove, async (member: GuildMember | PartialGuildMember) => {
    // Save roles for persistence on rejoin (exclude managed/everyone roles)
    if (!member.partial) {
      const roleIds = member.roles.cache
        .filter(r => !r.managed && r.id !== member.guild.id)
        .map(r => r.id);
      if (roleIds.length > 0) saveRoles(member.guild.id, member.user.id, roleIds);
    }

    const config = getConfig(member.guild.id);
    if (!config.log_members_channel_id) return;

    const logChannel = member.guild.channels.cache.get(config.log_members_channel_id) as TextChannel | undefined;
    if (!logChannel) return;

    const accountAge = member.user.createdAt
      ? `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`
      : "Unknown";

    const embed = new EmbedBuilder()
      .setColor(0xff6666)
      .setTitle("Member Left")
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: "User", value: `${member.user.tag} (${member.user.id})`, inline: true },
        { name: "Account Created", value: accountAge, inline: true },
        { name: "Joined Server", value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : "Unknown", inline: true },
        { name: "Members Now", value: `${member.guild.memberCount}`, inline: true },
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(() => {});
  });
}
