import { Client, Events, Message, PartialMessage, TextChannel, EmbedBuilder } from "discord.js";
import { getConfig } from "../db/guildConfig";
import { cacheDeletedMessage, isGhostPing } from "../utils/snipeCache";

export function registerMessageDeleteEvent(client: Client): void {
  client.on(Events.MessageDelete, async (msg: Message | PartialMessage) => {
    if (msg.author?.bot || !msg.guildId) return;

    cacheDeletedMessage(msg);

    const config = getConfig(msg.guildId);
    if (!config.log_messages_channel_id) return;

    const logChannel = msg.guild?.channels.cache.get(config.log_messages_channel_id) as TextChannel | undefined;
    if (!logChannel) return;

    const ghostPing = isGhostPing(msg);

    const embed = new EmbedBuilder()
      .setColor(ghostPing ? 0xff8800 : 0xff4444)
      .setTitle(ghostPing ? "👻 Ghost Ping Detected" : "Message Deleted")
      .addFields(
        { name: "Author", value: msg.author ? `${msg.author.tag} (${msg.author.id})` : "Unknown", inline: true },
        { name: "Channel", value: `<#${msg.channelId}>`, inline: true },
        { name: "Content", value: (msg.content || "*(no text content)*").slice(0, 1024) },
      )
      .setFooter({ text: `Message ID: ${msg.id}` })
      .setTimestamp();

    if (ghostPing && msg.mentions?.users.size) {
      embed.addFields({
        name: "Pinged Users",
        value: [...msg.mentions.users.values()].map(u => `${u.tag} (${u.id})`).join("\n"),
      });
    }

    if (msg.attachments?.size > 0) {
      embed.addFields({ name: "Attachments", value: msg.attachments.map(a => a.name).join(", "), inline: true });
    }

    await logChannel.send({ embeds: [embed] }).catch(() => {});
  });
}
