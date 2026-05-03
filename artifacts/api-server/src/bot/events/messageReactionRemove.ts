import { Client, Events, MessageReaction, PartialMessageReaction, User, PartialUser } from "discord.js";
import { getReactionRole } from "../db/reactionRoles";

export function registerMessageReactionRemoveEvent(client: Client): void {
  client.on(Events.MessageReactionRemove, async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
    if (user.bot) return;
    if (reaction.partial) { try { await reaction.fetch(); } catch { return; } }
    if (reaction.message.partial) { try { await reaction.message.fetch(); } catch { return; } }

    const { message } = reaction;
    if (!message.guildId || !message.guild) return;

    const emojiKey = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : (reaction.emoji.name ?? "");

    const reactionRole = getReactionRole(message.guildId, message.id, emojiKey)
      ?? getReactionRole(message.guildId, message.id, reaction.emoji.name ?? "");
    if (!reactionRole) return;

    const member = message.guild.members.cache.get(user.id) ?? await message.guild.members.fetch(user.id).catch(() => null);
    if (!member) return;
    const role = message.guild.roles.cache.get(reactionRole.role_id);
    if (role) await member.roles.remove(role).catch(() => {});
  });
}
