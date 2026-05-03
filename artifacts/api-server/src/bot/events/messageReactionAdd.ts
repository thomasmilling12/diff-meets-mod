import { Client, Events, MessageReaction, PartialMessageReaction, User, PartialUser, EmbedBuilder, TextChannel } from "discord.js";
import { getStarboardConfig, getStarboardEntry, upsertStarboardEntry, updateStarCount } from "../db/starboard";
import { getReactionRole } from "../db/reactionRoles";

export function registerMessageReactionAddEvent(client: Client): void {
  client.on(Events.MessageReactionAdd, async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
    if (user.bot) return;
    if (reaction.partial) { try { await reaction.fetch(); } catch { return; } }
    if (reaction.message.partial) { try { await reaction.message.fetch(); } catch { return; } }

    const { message } = reaction;
    if (!message.guildId || !message.guild) return;

    const emojiKey = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : (reaction.emoji.name ?? "");

    // ── Reaction roles ────────────────────────────────────────────────────────
    const reactionRole = getReactionRole(message.guildId, message.id, emojiKey)
      ?? getReactionRole(message.guildId, message.id, reaction.emoji.name ?? "");
    if (reactionRole) {
      const member = message.guild.members.cache.get(user.id) ?? await message.guild.members.fetch(user.id).catch(() => null);
      if (member) {
        const role = message.guild.roles.cache.get(reactionRole.role_id);
        if (role) await member.roles.add(role).catch(() => {});
      }
      return;
    }

    // ── Starboard ─────────────────────────────────────────────────────────────
    const config = getStarboardConfig(message.guildId);
    if (!config.enabled || !config.channel_id) return;
    if (reaction.emoji.name !== config.emoji && reaction.emoji.toString() !== config.emoji) return;
    if (message.channelId === config.channel_id) return;

    const starCount = reaction.count ?? 0;
    if (starCount < config.threshold) return;

    const starboardChannel = message.guild.channels.cache.get(config.channel_id) as TextChannel | undefined;
    if (!starboardChannel) return;

    const existing = getStarboardEntry(message.guildId, message.id);

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setAuthor({ name: message.author?.tag ?? "Unknown", iconURL: message.author?.displayAvatarURL() })
      .setDescription(message.content || null)
      .addFields(
        { name: "Source", value: `[Jump to message](${message.url})`, inline: true },
        { name: "Channel", value: `<#${message.channelId}>`, inline: true },
      )
      .setTimestamp(message.createdAt);

    if (message.attachments.size > 0) {
      const image = message.attachments.find(a => a.contentType?.startsWith("image/"));
      if (image) embed.setImage(image.url);
    }

    const content = `${config.emoji} **${starCount}** | <#${message.channelId}>`;

    if (existing) {
      updateStarCount(message.guildId, message.id, starCount);
      try {
        const sbMsg = await starboardChannel.messages.fetch(existing.starboard_message_id);
        await sbMsg.edit({ content, embeds: [embed] });
      } catch { /* deleted */ }
    } else {
      const sbMsg = await starboardChannel.send({ content, embeds: [embed] }).catch(() => null);
      if (sbMsg) upsertStarboardEntry(message.guildId, message.id, sbMsg.id, message.channelId, starCount);
    }
  });
}
