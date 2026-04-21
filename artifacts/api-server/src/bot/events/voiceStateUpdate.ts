import { Client, Events, VoiceState, TextChannel, EmbedBuilder } from "discord.js";
import { getConfig } from "../db/guildConfig";

export function registerVoiceStateUpdateEvent(client: Client): void {
  client.on(Events.VoiceStateUpdate, async (oldState: VoiceState, newState: VoiceState) => {
    if (newState.member?.user.bot) return;

    const config = getConfig(newState.guild.id);
    if (!config.log_voice_channel_id) return;

    const logChannel = newState.guild.channels.cache.get(config.log_voice_channel_id) as TextChannel | undefined;
    if (!logChannel) return;

    const user = newState.member?.user;
    if (!user) return;

    let title = "";
    let color = 0x5865f2;
    const fields = [{ name: "User", value: `${user.tag} (${user.id})`, inline: true }];

    if (!oldState.channelId && newState.channelId) {
      title = "Joined Voice Channel";
      color = 0x00cc66;
      fields.push({ name: "Channel", value: `<#${newState.channelId}>`, inline: true });
    } else if (oldState.channelId && !newState.channelId) {
      title = "Left Voice Channel";
      color = 0xff4444;
      fields.push({ name: "Channel", value: `<#${oldState.channelId}>`, inline: true });
    } else if (oldState.channelId !== newState.channelId) {
      title = "Moved Voice Channel";
      color = 0xffa500;
      fields.push(
        { name: "From", value: `<#${oldState.channelId}>`, inline: true },
        { name: "To", value: `<#${newState.channelId}>`, inline: true },
      );
    } else if (!oldState.mute && newState.mute) {
      title = "Server Muted";
      color = 0xff6600;
      fields.push({ name: "Channel", value: `<#${newState.channelId}>`, inline: true });
    } else if (oldState.mute && !newState.mute) {
      title = "Server Unmuted";
      color = 0x00cc66;
      fields.push({ name: "Channel", value: `<#${newState.channelId}>`, inline: true });
    } else {
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .addFields(fields)
      .setTimestamp();

    await logChannel.send({ embeds: [embed] }).catch(() => {});
  });
}
