import { Client, Events, GuildMember, TextChannel, EmbedBuilder } from "discord.js";
import { getConfig } from "../db/guildConfig";
import { checkRaid } from "../utils/raidProtectionHandler";
import { botLogger } from "../logger";

export function registerGuildMemberAddEvent(client: Client): void {
  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    const guildId = member.guild.id;
    const config = getConfig(guildId);

    await checkRaid(member).catch(() => {});

    if (config.auto_role_id) {
      const role = member.guild.roles.cache.get(config.auto_role_id);
      if (role) {
        await member.roles.add(role).catch((err: unknown) => {
          botLogger.warn({ err, userId: member.id }, "Failed to assign auto-role");
        });
      }
    }

    if (config.welcome_channel_id && config.welcome_message) {
      const channel = member.guild.channels.cache.get(config.welcome_channel_id) as TextChannel | undefined;
      if (channel) {
        const message = config.welcome_message
          .replace("{user}", member.toString())
          .replace("{server}", member.guild.name)
          .replace("{count}", String(member.guild.memberCount));
        await channel.send(message).catch((err: unknown) => {
          botLogger.warn({ err }, "Failed to send welcome message");
        });
      }
    }

    if (config.log_members_channel_id) {
      const logChannel = member.guild.channels.cache.get(config.log_members_channel_id) as TextChannel | undefined;
      if (logChannel) {
        const accountAgeMs = Date.now() - member.user.createdTimestamp;
        const newAccount = accountAgeMs < 7 * 24 * 60 * 60 * 1000;
        const embed = new EmbedBuilder()
          .setColor(0x00cc66)
          .setTitle("Member Joined")
          .setThumbnail(member.user.displayAvatarURL())
          .addFields(
            { name: "User", value: `${member.user.tag} (${member.user.id})`, inline: true },
            { name: "Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: "Members Now", value: `${member.guild.memberCount}`, inline: true },
          );
        if (newAccount) embed.addFields({ name: "⚠️ New Account", value: "Less than 7 days old", inline: true });
        embed.setTimestamp();
        await logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    }
  });
}
