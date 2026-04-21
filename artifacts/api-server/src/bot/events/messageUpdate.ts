import { Client, Events, Message, PartialMessage, TextChannel, EmbedBuilder } from "discord.js";
import { getConfig } from "../db/guildConfig";

export function registerMessageUpdateEvent(client: Client): void {
  client.on(Events.MessageUpdate, async (oldMsg: Message | PartialMessage, newMsg: Message | PartialMessage) => {
    if (newMsg.author?.bot || !newMsg.guildId) return;
    if (oldMsg.content === newMsg.content) return;

    const config = getConfig(newMsg.guildId);
    if (!config.log_messages_channel_id) return;

    const logChannel = newMsg.guild?.channels.cache.get(config.log_messages_channel_id) as TextChannel | undefined;
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle("Message Edited")
      .addFields(
        { name: "Author", value: `${newMsg.author?.tag ?? "Unknown"} (${newMsg.author?.id ?? "?"})`, inline: true },
        { name: "Channel", value: `<#${newMsg.channelId}>`, inline: true },
        { name: "Before", value: (oldMsg.content || "*(empty)*").slice(0, 1024) },
        { name: "After", value: (newMsg.content || "*(empty)*").slice(0, 1024) },
      )
      .setFooter({ text: `Message ID: ${newMsg.id}` })
      .setTimestamp();

    if (newMsg.url) {
      embed.addFields({ name: "Jump", value: `[Go to message](${newMsg.url})`, inline: true });
    }

    await logChannel.send({ embeds: [embed] }).catch(() => {});
  });
}
