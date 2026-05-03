import { ContextMenuCommandBuilder, ApplicationCommandType, MessageContextMenuCommandInteraction, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { getConfig } from "../../db/guildConfig";
import { sendModLog } from "../../utils/modLog";

const command: Command = {
  data: new ContextMenuCommandBuilder()
    .setName("Delete & Log")
    .setType(ApplicationCommandType.Message)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages) as unknown as import("discord.js").SlashCommandBuilder,

  async execute(interaction: MessageContextMenuCommandInteraction) {
    const message = interaction.targetMessage;
    const guildId = interaction.guildId!;

    const embed = new EmbedBuilder()
      .setColor(0xff4444)
      .setTitle("Message Deleted by Moderator")
      .addFields(
        { name: "Author", value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: "Channel", value: `<#${message.channelId}>`, inline: true },
        { name: "Content", value: (message.content || "*(no text)*").slice(0, 1024) },
        { name: "Deleted By", value: interaction.user.tag, inline: true },
      )
      .setTimestamp();

    await message.delete().catch(() => {});
    await interaction.reply({ embeds: [embed], ephemeral: true });

    await sendModLog(
      interaction.client, guildId, "DELETE",
      message.author, interaction.user.tag,
      `Message in <#${message.channelId}> deleted`,
      { "Content": (message.content || "*(no text)*").slice(0, 200) }
    );
  },
};

export default command;
