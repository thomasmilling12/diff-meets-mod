import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Show a user's avatar in full size")
    .addUserOption(o => o.setName("user").setDescription("User to get avatar of (default: you)").setRequired(false))
    .addBooleanOption(o => o.setName("server").setDescription("Show their server avatar if they have one (default: true)").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user") ?? interaction.user;
    const showServer = interaction.options.getBoolean("server") ?? true;

    const member = showServer && interaction.guildId
      ? (interaction.guild?.members.cache.get(target.id) ?? await interaction.guild?.members.fetch(target.id).catch(() => null))
      : null;

    const globalAvatar = target.displayAvatarURL({ size: 4096 });
    const serverAvatar = member?.avatarURL({ size: 4096 }) ?? null;
    const displayAvatar = (showServer && serverAvatar) ? serverAvatar : globalAvatar;

    const formats = (url: string) => {
      const base = url.split("?")[0];
      const isGif = base.endsWith(".gif");
      return [
        `[WebP](${base.replace(/\.(png|gif|jpg)$/, ".webp")}?size=4096)`,
        `[PNG](${base.replace(/\.(webp|gif|jpg)$/, ".png")}?size=4096)`,
        `[JPG](${base.replace(/\.(webp|gif|png)$/, ".jpg")}?size=4096)`,
        ...(isGif ? [`[GIF](${base}?size=4096)`] : []),
      ].join(" · ");
    };

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`${target.tag}'s Avatar`)
      .setImage(displayAvatar)
      .addFields({ name: "Links", value: formats(displayAvatar) });

    if (serverAvatar && globalAvatar !== serverAvatar) {
      embed.addFields({ name: "Global Avatar", value: formats(globalAvatar) });
    }

    embed.setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
