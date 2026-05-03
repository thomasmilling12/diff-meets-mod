import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription("View server assets — icon, banner, splash, invite background")
    .addSubcommand(s => s.setName("icon").setDescription("Show the server icon"))
    .addSubcommand(s => s.setName("banner").setDescription("Show the server banner"))
    .addSubcommand(s => s.setName("splash").setDescription("Show the invite splash screen"))
    .addSubcommand(s => s.setName("info").setDescription("Full server info embed")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild!;

    const fmt = (url: string) => {
      const base = url.split("?")[0];
      const isGif = base.endsWith(".gif");
      return [
        `[WebP](${base.replace(/\.(png|gif|jpg)$/, ".webp")}?size=4096)`,
        `[PNG](${base.replace(/\.(webp|gif|jpg)$/, ".png")}?size=4096)`,
        ...(isGif ? [`[GIF](${base}?size=4096)`] : []),
      ].join(" · ");
    };

    if (sub === "icon") {
      const url = guild.iconURL({ size: 4096 });
      if (!url) { await interaction.reply({ content: "This server has no icon.", ephemeral: true }); return; }
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle(`${guild.name} — Icon`).setImage(url).addFields({ name: "Download", value: fmt(url) }).setTimestamp()] });

    } else if (sub === "banner") {
      const url = guild.bannerURL({ size: 4096 });
      if (!url) { await interaction.reply({ content: "This server has no banner. (Requires Level 2 boost)", ephemeral: true }); return; }
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle(`${guild.name} — Banner`).setImage(url).addFields({ name: "Download", value: fmt(url) }).setTimestamp()] });

    } else if (sub === "splash") {
      const url = guild.splashURL({ size: 4096 });
      if (!url) { await interaction.reply({ content: "This server has no invite splash. (Requires Level 1 boost)", ephemeral: true }); return; }
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle(`${guild.name} — Invite Splash`).setImage(url).addFields({ name: "Download", value: fmt(url) }).setTimestamp()] });

    } else {
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(guild.name)
        .setThumbnail(guild.iconURL())
        .addFields(
          { name: "ID", value: guild.id, inline: true },
          { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
          { name: "Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
          { name: "Members", value: `${guild.memberCount}`, inline: true },
          { name: "Channels", value: `${guild.channels.cache.size}`, inline: true },
          { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
          { name: "Boost Level", value: `Level ${guild.premiumTier}`, inline: true },
          { name: "Boosts", value: `${guild.premiumSubscriptionCount ?? 0}`, inline: true },
          { name: "Emoji", value: `${guild.emojis.cache.size}`, inline: true },
          { name: "Verification", value: `${guild.verificationLevel}`, inline: true },
          { name: "Explicit Filter", value: `${guild.explicitContentFilter}`, inline: true },
          { name: "2FA Required", value: guild.mfaLevel === 1 ? "Yes" : "No", inline: true },
        )
        .setTimestamp();
      if (guild.bannerURL()) embed.setImage(guild.bannerURL({ size: 2048 }));
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
