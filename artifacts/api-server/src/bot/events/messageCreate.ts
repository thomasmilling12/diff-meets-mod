import { Client, Events, Message, TextChannel } from "discord.js";
import { getConfig } from "../db/guildConfig";
import { findCustomCommand } from "../db/customCommands";
import { containsFilteredWord } from "../db/wordFilter";
import { isPhishingLink } from "../utils/antiphishing";
import { sendModLog } from "../utils/modLog";
import { botLogger } from "../logger";

const spamTracker: Map<string, { count: number; lastMessage: number }> = new Map();
const INVITE_REGEX = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-zA-Z0-9-]+/i;
const LINK_REGEX = /https?:\/\/[^\s]+/i;

async function sendAndAutoDelete(channel: TextChannel, content: string, ms = 5000): Promise<void> {
  const msg = await channel.send(content).catch(() => null);
  if (msg) setTimeout(() => msg.delete().catch(() => {}), ms);
}

async function autoModCheck(message: Message, config: ReturnType<typeof getConfig>): Promise<boolean> {
  if (!(message.channel instanceof TextChannel)) return false;
  const member = message.guild?.members.cache.get(message.author.id);
  if (!member || member.permissions.has("ManageMessages")) return false;

  const content = message.content;
  const channel = message.channel as TextChannel;
  const guildId = message.guildId!;

  if (config.automod_anti_phishing && isPhishingLink(content)) {
    await message.delete().catch(() => {});
    await sendAndAutoDelete(channel, `${message.author}, phishing links are not allowed!`);
    await sendModLog(message.client, guildId, "PHISHING", message.author, "Auto-Mod", "Sent a phishing link");
    return true;
  }

  if (config.automod_anti_invite && INVITE_REGEX.test(content)) {
    await message.delete().catch(() => {});
    await sendAndAutoDelete(channel, `${message.author}, Discord invite links are not allowed here.`);
    return true;
  }

  if (config.automod_anti_links && LINK_REGEX.test(content) && !INVITE_REGEX.test(content)) {
    await message.delete().catch(() => {});
    await sendAndAutoDelete(channel, `${message.author}, external links are not allowed here.`);
    return true;
  }

  const filteredWord = containsFilteredWord(guildId, content);
  if (filteredWord) {
    await message.delete().catch(() => {});
    await sendAndAutoDelete(channel, `${message.author}, your message contained a filtered word.`);
    await sendModLog(message.client, guildId, "WORD_FILTER", message.author, "Auto-Mod", `Used filtered word: "${filteredWord}"`);
    return true;
  }

  if (config.automod_anti_caps && content.length > 8) {
    const letters = content.replace(/[^A-Za-z]/g, "");
    if (letters.length > 0 && letters.replace(/[^A-Z]/g, "").length / letters.length > 0.7) {
      await message.delete().catch(() => {});
      await sendAndAutoDelete(channel, `${message.author}, please avoid excessive caps.`);
      return true;
    }
  }

  if (config.automod_anti_mention) {
    const mentionCount = (content.match(/<@[!&]?\d+>/g) || []).length;
    if (mentionCount >= 5) {
      await message.delete().catch(() => {});
      await sendAndAutoDelete(channel, `${message.author}, mass mentions are not allowed.`);
      return true;
    }
  }

  if (config.automod_anti_spam) {
    const key = `${guildId}:${message.author.id}`;
    const now = Date.now();
    const tracker = spamTracker.get(key) ?? { count: 0, lastMessage: 0 };
    tracker.count = now - tracker.lastMessage < 3000 ? tracker.count + 1 : 1;
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
    if (message.author.bot || !message.guild || !message.guildId) return;

    const config = getConfig(message.guildId);
    const blocked = await autoModCheck(message, config);
    if (blocked) return;

    if (message.channel instanceof TextChannel) {
      const custom = findCustomCommand(message.guildId, message.content.trim().toLowerCase());
      if (custom) {
        await (message.channel as TextChannel).send(custom.response).catch((err: unknown) => {
          botLogger.error({ err }, "Failed to send custom command response");
        });
      }
    }
  });
}
