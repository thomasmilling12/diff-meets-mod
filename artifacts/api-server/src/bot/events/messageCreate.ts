import { Client, Events, Message, TextChannel, ChannelType, PermissionFlagsBits, EmbedBuilder, NewsChannel } from "discord.js";
import { getConfig } from "../db/guildConfig";
import { findCustomCommand } from "../db/customCommands";
import { containsFilteredWord } from "../db/wordFilter";
import { isPhishingLink } from "../utils/antiphishing";
import { sendModLog } from "../utils/modLog";
import { isAutoThreadChannel } from "../db/autoThread";
import { getAllEnabledModmailGuilds, getOpenModmailByUser, createModmailThread, getModmailByChannel } from "../db/modmail";
import { getAfk, clearAfk } from "../db/afk";
import { getSticky, updateStickyMessageId } from "../db/stickyMessages";
import { isAutoPublish } from "../db/autoPublish";
import { getGuildHighlights } from "../db/highlights";
import { getCountingByChannel, incrementCount, resetCount } from "../db/countingChannels";
import { botLogger } from "../logger";

const spamTracker: Map<string, { count: number; lastMessage: number }> = new Map();
const INVITE_REGEX = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-zA-Z0-9-]+/i;
const LINK_REGEX = /https?:\/\/[^\s]+/i;
const MENTION_REGEX = /<@!?(\d+)>/g;

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

    // ── Handle DMs — modmail forwarding ──────────────────────────────────────
    if (!message.guild && !message.author.bot) {
      try {
        const guilds = getAllEnabledModmailGuilds();
        for (const mmConfig of guilds) {
          const guild = client.guilds.cache.get(mmConfig.guild_id);
          if (!guild) continue;
          const member = await guild.members.fetch(message.author.id).catch(() => null);
          if (!member) continue;

          const existingThread = getOpenModmailByUser(mmConfig.guild_id, message.author.id);
          if (existingThread) {
            const channel = guild.channels.cache.get(existingThread.channel_id) as TextChannel | undefined;
            if (channel) {
              await channel.send({
                embeds: [new EmbedBuilder().setColor(0x5865f2)
                  .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                  .setDescription(message.content || "*(attachment)*")
                  .setTimestamp()]
              }).catch(() => {});
            }
          } else {
            const category = mmConfig.category_id ? guild.channels.cache.get(mmConfig.category_id) : undefined;
            const channel = await guild.channels.create({
              name: `mail-${message.author.username}`.slice(0, 100),
              type: ChannelType.GuildText,
              parent: category?.id,
              topic: `Modmail from ${message.author.tag} (${message.author.id})`,
              permissionOverwrites: [
                { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
                { id: client.user!.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
              ],
            }).catch(() => null);

            if (channel) {
              createModmailThread(mmConfig.guild_id, channel.id, message.author.id, message.author.tag);
              const openEmbed = new EmbedBuilder().setColor(0x5865f2)
                .setTitle(`📬 New Modmail — ${message.author.tag}`)
                .setDescription(message.content || "*(attachment)*")
                .addFields({ name: "User ID", value: message.author.id, inline: true })
                .setThumbnail(message.author.displayAvatarURL())
                .setTimestamp();
              await channel.send({ embeds: [openEmbed] }).catch(() => {});
              await message.author.send(mmConfig.response_message).catch(() => {});
            }
          }
          break;
        }
      } catch (err) {
        botLogger.warn({ err }, "Modmail DM handling error");
      }
      return;
    }

    if (message.author.bot || !message.guild || !message.guildId) return;

    const config = getConfig(message.guildId);

    // ── Modmail reply: mod types in modmail channel → forward to user DM ─────
    if (message.channel instanceof TextChannel) {
      const thread = getModmailByChannel(message.channelId);
      if (thread && thread.status === "open") {
        try {
          const user = await client.users.fetch(thread.user_id).catch(() => null);
          if (user) {
            const embed = new EmbedBuilder()
              .setColor(0x5865f2)
              .setAuthor({ name: `${message.guild.name} — Support`, iconURL: message.guild.iconURL() ?? undefined })
              .setDescription(message.content || "*(attachment)*")
              .setTimestamp();
            await user.send({ embeds: [embed] }).catch(() => {});
            await message.react("✅").catch(() => {});
          }
        } catch { /* ignore */ }
        return;
      }
    }

    const blocked = await autoModCheck(message, config);
    if (blocked) return;

    // ── AFK: clear sender's AFK if they just spoke ───────────────────────────
    const senderAfk = getAfk(message.author.id, message.guildId);
    if (senderAfk) {
      clearAfk(message.author.id, message.guildId);
      await message.reply({ content: "Welcome back! Your AFK status has been cleared." })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 5000))
        .catch(() => {});
    }

    // ── AFK: notify when a mentioned user is AFK ─────────────────────────────
    if (message.channel instanceof TextChannel) {
      const mentioned = new Set<string>();
      let match: RegExpExecArray | null;
      MENTION_REGEX.lastIndex = 0;
      while ((match = MENTION_REGEX.exec(message.content)) !== null) {
        mentioned.add(match[1]);
      }
      for (const userId of mentioned) {
        if (userId === message.author.id) continue;
        const afk = getAfk(userId, message.guildId);
        if (afk) {
          await message.reply({ content: `💤 <@${userId}> is currently AFK: **${afk.reason}** (since <t:${afk.set_at}:R>)` })
            .then(m => setTimeout(() => m.delete().catch(() => {}), 8000))
            .catch(() => {});
        }
      }
    }

    // ── Counting channel ──────────────────────────────────────────────────────
    const countingConfig = getCountingByChannel(message.channelId);
    if (countingConfig && message.guildId === countingConfig.guild_id) {
      const num = parseInt(message.content.trim(), 10);
      const expected = countingConfig.current_count + 1;
      const isCorrect = !isNaN(num) && num === expected && message.content.trim() === String(num);
      const isDoubleCount = countingConfig.last_user_id === message.author.id;

      if (isCorrect && !isDoubleCount) {
        await message.react("✅").catch(() => {});
        incrementCount(message.guildId, message.author.id, num);
      } else {
        const reason = isDoubleCount ? "You can't count twice in a row!" : `Wrong number! Expected **${expected}**.`;
        await message.react("❌").catch(() => {});
        await message.reply(`💥 ${reason} The count has been reset to **0**. Next: **1**`).catch(() => {});
        resetCount(message.guildId);
      }
      return;
    }

    // ── Highlights ────────────────────────────────────────────────────────────
    if (message.guildId && !message.author.bot) {
      const highlights = getGuildHighlights(message.guildId);
      if (highlights.length > 0) {
        const contentLower = message.content.toLowerCase();
        const alerted = new Set<string>();
        for (const h of highlights) {
          if (h.user_id === message.author.id) continue;
          if (alerted.has(h.user_id)) continue;
          const member = message.guild?.members.cache.get(h.user_id);
          if (!member) continue;
          const readable = ("permissionsFor" in message.channel) ? message.channel.permissionsFor(member)?.has("ViewChannel") : false;
          if (!readable) continue;
          if (contentLower.includes(h.keyword)) {
            alerted.add(h.user_id);
            const preview = message.content.slice(0, 200);
            await member.user.send({
              embeds: [new EmbedBuilder().setColor(0xffd700).setTitle("💬 Highlight Triggered")
                .setDescription(`Your keyword \`${h.keyword}\` was mentioned in **${message.guild?.name}** → <#${message.channelId}>`)
                .addFields({ name: "Message", value: preview }, { name: "Author", value: message.author.tag, inline: true })
                .setURL(message.url).setTimestamp()],
            }).catch(() => {});
          }
        }
      }
    }

    // ── Auto-publish (News channels) ─────────────────────────────────────────
    if (message.channel instanceof NewsChannel) {
      if (isAutoPublish(message.guildId, message.channelId)) {
        await message.crosspost().catch(() => {});
      }
    }

    // ── Sticky messages ───────────────────────────────────────────────────────
    if (message.channel instanceof TextChannel) {
      const sticky = getSticky(message.guildId, message.channelId);
      if (sticky && message.id !== sticky.last_message_id) {
        if (sticky.last_message_id) {
          await message.channel.messages.delete(sticky.last_message_id).catch(() => {});
        }
        const stickyMsg = await message.channel.send(sticky.content).catch(() => null);
        if (stickyMsg) updateStickyMessageId(message.guildId, message.channelId, stickyMsg.id);
      }
    }

    // ── Auto-thread ───────────────────────────────────────────────────────────
    if (message.channel instanceof TextChannel) {
      const atConfig = isAutoThreadChannel(message.guildId, message.channelId);
      if (atConfig) {
        try {
          const title = message.content.slice(0, 50).replace(/\n/g, " ") || "Discussion";
          const threadName = atConfig.thread_name_format.replace("{title}", title);
          const archiveMap: Record<number, 60 | 1440 | 4320 | 10080> = { 1: 60, 24: 1440, 72: 4320, 168: 10080 };
          const archiveDuration = archiveMap[atConfig.archive_hours] ?? 1440;
          await message.startThread({ name: threadName, autoArchiveDuration: archiveDuration });
        } catch { /* ignore */ }
      }

      // ── Custom commands ───────────────────────────────────────────────────
      const custom = findCustomCommand(message.guildId, message.content.trim().toLowerCase());
      if (custom) {
        await (message.channel as TextChannel).send(custom.response).catch((err: unknown) => {
          botLogger.error({ err }, "Failed to send custom command response");
        });
      }
    }
  });
}
