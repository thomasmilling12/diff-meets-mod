import { Client, Events, GuildMember, TextChannel } from "discord.js";
import { getConfig } from "../db/guildConfig";
import { botLogger } from "../logger";

export function registerGuildMemberAddEvent(client: Client): void {
  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    const guildId = member.guild.id;
    const config = getConfig(guildId);

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
  });
}
