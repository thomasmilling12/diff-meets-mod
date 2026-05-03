import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, TextChannel, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";
import type { Command } from "../../client";
import { getTicketConfig } from "../../db/tickets";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("report")
    .setDescription("Report a user to the moderators anonymously")
    .addUserOption(o => o.setName("user").setDescription("User to report").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("What did they do?").setRequired(true).setMaxLength(500)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);
    const guildId = interaction.guildId!;
    const guild = interaction.guild!;

    if (target.id === interaction.user.id) {
      await interaction.reply({ content: "You cannot report yourself.", ephemeral: true });
      return;
    }
    if (target.bot) {
      await interaction.reply({ content: "You cannot report bots.", ephemeral: true });
      return;
    }

    const ticketConfig = getTicketConfig(guildId);
    const logChannelId = ticketConfig.log_channel_id;
    if (!logChannelId) {
      await interaction.reply({ content: "Reports are not configured for this server. Contact a moderator directly.", ephemeral: true });
      return;
    }

    const logChannel = guild.channels.cache.get(logChannelId) as TextChannel | undefined;
    if (!logChannel) {
      await interaction.reply({ content: "The report channel could not be found. Contact a moderator directly.", ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xff4444)
      .setTitle("🚨 New User Report")
      .addFields(
        { name: "Reported User", value: `${target.tag} (${target.id})`, inline: true },
        { name: "Reason", value: reason },
        { name: "Message Channel", value: interaction.channel ? `<#${interaction.channelId}>` : "Unknown", inline: true },
        { name: "Submitted", value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true },
      )
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: "Reporter identity kept confidential" })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
    await interaction.reply({ content: "✅ Your report has been submitted. Thank you for helping keep the server safe.", ephemeral: true });
  },
};

export default command;
