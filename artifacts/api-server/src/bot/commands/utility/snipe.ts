import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { getSnipe } from "../../utils/snipeCache";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("snipe")
    .setDescription("Show the last deleted message in this channel"),

  async execute(interaction: ChatInputCommandInteraction) {
    const entry = getSnipe(interaction.channelId);
    if (!entry) {
      await interaction.reply({ content: "Nothing to snipe here — either nothing was deleted recently, or the message is too old (5 min limit).", ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xff4444)
      .setAuthor({ name: entry.authorTag, iconURL: entry.authorAvatarURL ?? undefined })
      .setDescription(entry.content || "*(no text content)*")
      .setFooter({ text: `Deleted in #${"name" in (interaction.channel ?? {}) ? (interaction.channel as { name: string }).name : "this channel"}` })
      .setTimestamp(entry.deletedAt);

    if (entry.attachments.length > 0) {
      embed.setImage(entry.attachments[0]);
      if (entry.attachments.length > 1) {
        embed.addFields({ name: "Attachments", value: entry.attachments.slice(1).join("\n"), inline: false });
      }
    }

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
