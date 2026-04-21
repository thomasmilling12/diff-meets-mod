import { Client, Events, Message, TextChannel } from "discord.js";
import { getAutoModConfig } from "../utils/guildConfig";
import { findCustomCommand } from "../utils/customCommands";
import { botLogger } from "../logger";

const spamTracker: Map<string, { count: number; lastMessage: number }> = new Map();
const INVITE_REGEX = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-zA-Z0-9-]+/i;
const LINK_REGEX = /https?:\/\/[^\s]+/i;

async function sendAndAutoDelete(channel: TextChannel, content: string, ms = 5000): Promise<void> {
  const msg = await channel.send(content).catch(() => null);
  if (msg) setTimeout(() => msg.delete().catch(() => {}), ms);
}

async function autoModCheck(message: Message): Promise<boolean> {
  if (!message.guild || message.author.bot) return false;
  if (!(message.channel instanceof TextChannel)) return false;

  const config = getAutoModConfig(message.guild.id);
  const member = message.guild.members.cache.get(message.author.id);
  if (!member) return false;
  if (member.permissions.has("ManageMessages")) return false;

  const content = message.content;
  const channel = message.channel as TextChannel;

  if (config.antiInvite && INVITE_REGEX.test(content)) {
    await message.delete().catch(() => {});
    await sendAndAutoDelete(channel, `${message.author}, Discord invite links are not allowed here.`);
    return true;
  }

  if (config.antiLinks && LINK_REGEX.test(content) && !INVITE_REGEX.test(content)) {
    await message.delete().catch(() => {});
    await sendAndAutoDelete(channel, `${message.author}, external links are not allowed here.`);
    return true;
  }

  if (config.antiCaps && content.length > 8) {
    const letters = content.replace(/[^A-Za-z]/g, "");
    if (letters.length > 0 && (letters.replace(/[^A-Z]/g, "").length / letters.length) > 0.7) {
      await message.delete().catch(() => {});
      await sendAndAutoDelete(channel, `${message.author}, please avoid excessive caps.`);
      return true;
    }
  }

  if (config.antiMention) {
    const mentionCount = (content.match(/<@[!&]?\d+>/g) || []).length;
    if (mentionCount >= 5) {
      await message.delete().catch(() => {});
      await sendAndAutoDelete(channel, `${message.author}, mass mentions are not allowed.`);
      return true;
    }
  }

  if (config.antiSpam) {
    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    const tracker = spamTracker.get(key) ?? { count: 0, lastMessage: 0 };

    if (now - tracker.lastMessage < 3000) {
      tracker.count++;
    } else {
      tracker.count = 1;
    }
    tracker.lastMessage = now;
    spamTracker.set(key, tracker);

    if (tracker.count >= 5) {
      await message.delete().catch(() => {});
      await sendAndAutoDelete(channel, `${message.author}, please stop spamming.`);
      tracker.count = 0;
      spamTracker.set(key, tracker);
      return true;
    }
  }

  return false;
}

export function registerMessageCreateEvent(client: Client): void {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot || !message.guild) return;

    const blocked = await autoModCheck(message);
    if (blocked) return;

    if (!message.guildId) return;
    const custom = findCustomCommand(message.guildId, message.content.trim().toLowerCase());
    if (custom && message.channel instanceof TextChannel) {
      await (message.channel as TextChannel).send(custom.response).catch((err: unknown) => {
        botLogger.error({ err }, "Failed to send custom command response");
      });
    }
  });
}
