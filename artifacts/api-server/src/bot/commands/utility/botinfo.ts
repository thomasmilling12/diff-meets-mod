import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { commands } from "../../client";

const startTime = Date.now();

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

function formatMemory(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("Show bot statistics — uptime, guilds, memory, commands"),

  async execute(interaction: ChatInputCommandInteraction) {
    const mem = process.memoryUsage();
    const client = interaction.client;
    const guilds = client.guilds.cache.size;
    const users = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
    const channels = client.channels.cache.size;
    const uptimeMs = Date.now() - startTime;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`${client.user?.username ?? "Bot"} — Bot Info`)
      .setThumbnail(client.user?.displayAvatarURL() ?? null)
      .addFields(
        { name: "⏱️ Uptime", value: formatUptime(uptimeMs), inline: true },
        { name: "📡 Latency", value: `${client.ws.ping}ms`, inline: true },
        { name: "🏠 Guilds", value: `${guilds}`, inline: true },
        { name: "👥 Users", value: users.toLocaleString(), inline: true },
        { name: "📢 Channels", value: `${channels}`, inline: true },
        { name: "🤖 Commands", value: `${commands.size}`, inline: true },
        { name: "💾 Heap Used", value: formatMemory(mem.heapUsed), inline: true },
        { name: "💾 RSS", value: formatMemory(mem.rss), inline: true },
        { name: "🚀 Node.js", value: process.version, inline: true },
        { name: "📦 discord.js", value: "v14", inline: true },
      )
      .setFooter({ text: `Bot ID: ${client.user?.id}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
