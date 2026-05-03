import { Message, PartialMessage } from "discord.js";

export interface SnipeEntry {
  content: string;
  authorTag: string;
  authorId: string;
  authorAvatarURL: string | null;
  channelId: string;
  attachments: string[];
  deletedAt: Date;
  hadMentions: string[];
}

const snipeCache = new Map<string, SnipeEntry>();
const MAX_AGE_MS = 5 * 60 * 1000;

export function cacheDeletedMessage(msg: Message | PartialMessage): void {
  if (!msg.author || msg.author.bot || !msg.guildId) return;
  const mentions = msg.mentions?.users.map(u => u.id) ?? [];
  snipeCache.set(msg.channelId, {
    content: msg.content ?? "",
    authorTag: msg.author.tag,
    authorId: msg.author.id,
    authorAvatarURL: msg.author.displayAvatarURL(),
    channelId: msg.channelId,
    attachments: [...(msg.attachments?.map(a => a.proxyURL) ?? [])],
    deletedAt: new Date(),
    hadMentions: mentions,
  });
}

export function getSnipe(channelId: string): SnipeEntry | null {
  const entry = snipeCache.get(channelId);
  if (!entry) return null;
  if (Date.now() - entry.deletedAt.getTime() > MAX_AGE_MS) {
    snipeCache.delete(channelId);
    return null;
  }
  return entry;
}

export function isGhostPing(msg: Message | PartialMessage): boolean {
  if (!msg.author || msg.author.bot) return false;
  const mentions = msg.mentions?.users.size ?? 0;
  const roleMentions = msg.mentions?.roles.size ?? 0;
  const everyoneMention = msg.mentions?.everyone ?? false;
  const ageMs = msg.createdTimestamp ? Date.now() - msg.createdTimestamp : Infinity;
  return (mentions > 0 || roleMentions > 0 || everyoneMention) && ageMs < 60_000;
}
