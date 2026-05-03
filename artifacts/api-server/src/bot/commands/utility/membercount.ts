import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("membercount")
    .setDescription("Show a breakdown of member counts for this server"),

  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    await guild.members.fetch().catch(() => {});

    const total = guild.memberCount;
    const cached = guild.members.cache;
    const bots = cached.filter(m => m.user.bot).size;
    const humans = cached.filter(m => !m.user.bot).size;
    const boosters = guild.members.cache.filter(m => m.premiumSince !== null).size;
    const online = guild.members.cache.filter(m => m.presence?.status === "online").size;
    const idle = guild.members.cache.filter(m => m.presence?.status === "idle").size;
    const dnd = guild.members.cache.filter(m => m.presence?.status === "dnd").size;
    const offline = humans - online - idle - dnd;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`👥 Member Count — ${guild.name}`)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: "Total Members", value: `${total}`, inline: true },
        { name: "Humans", value: `${humans}`, inline: true },
        { name: "Bots", value: `${bots}`, inline: true },
        { name: "🟢 Online", value: `${online}`, inline: true },
        { name: "🌙 Idle", value: `${idle}`, inline: true },
        { name: "⛔ Do Not Disturb", value: `${dnd}`, inline: true },
        { name: "⚫ Offline", value: `${offline}`, inline: true },
        { name: "💎 Boosters", value: `${boosters}`, inline: true },
        { name: "Boost Level", value: `Level ${guild.premiumTier}`, inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
