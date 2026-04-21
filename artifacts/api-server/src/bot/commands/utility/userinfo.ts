import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { getWarnings } from "../../utils/warnings";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Get information about a user")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("The user to inspect (defaults to yourself)").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user") ?? interaction.user;
    const member = interaction.guild?.members.cache.get(target.id);
    const warnings = getWarnings(interaction.guildId!, target.id);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`User Info: ${target.tag}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: "ID", value: target.id, inline: true },
        { name: "Account Created", value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "Warnings", value: `${warnings.length}`, inline: true },
      );

    if (member) {
      embed.addFields(
        { name: "Joined Server", value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : "Unknown", inline: true },
        { name: "Nickname", value: member.nickname ?? "None", inline: true },
        { name: "Roles", value: member.roles.cache.filter(r => r.id !== interaction.guildId).map(r => r.toString()).join(", ") || "None" },
      );

      if (member.isCommunicationDisabled()) {
        embed.addFields({ name: "Timeout Until", value: `<t:${Math.floor(member.communicationDisabledUntilTimestamp! / 1000)}:R>`, inline: true });
      }
    }

    embed.setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
