import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Get information about this server"),

  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    await guild.fetch();

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
        { name: "Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "Members", value: `${guild.memberCount}`, inline: true },
        { name: "Channels", value: `${guild.channels.cache.size}`, inline: true },
        { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
        { name: "Boosts", value: `${guild.premiumSubscriptionCount ?? 0} (Level ${guild.premiumTier})`, inline: true },
        { name: "Verification Level", value: `${guild.verificationLevel}`, inline: true },
      )
      .setFooter({ text: `ID: ${guild.id}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
