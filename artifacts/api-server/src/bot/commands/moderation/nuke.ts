import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, TextChannel, ChannelType, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("nuke")
    .setDescription("Clone and delete a channel to wipe all messages (keeps settings, roles, position)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(o => o.setName("channel").setDescription("Channel to nuke (default: current)").addChannelTypes(ChannelType.GuildText).setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel | null;
    if (!target || !(target instanceof TextChannel)) {
      await interaction.reply({ content: "This can only be used in a text channel.", ephemeral: true });
      return;
    }

    await interaction.reply({ content: "💣 Nuking channel…", ephemeral: true });

    try {
      const clone = await target.clone({
        name: target.name,
        reason: `Channel nuked by ${interaction.user.tag}`,
      });

      await clone.setPosition(target.position);
      await target.delete(`Nuked by ${interaction.user.tag}`);

      await clone.send({
        embeds: [new EmbedBuilder()
          .setColor(0xff4444)
          .setTitle("💣 Channel Nuked")
          .setDescription(`This channel was wiped by **${interaction.user.tag}**.\nAll previous messages have been deleted.`)
          .setImage("https://media.tenor.com/VHbAtcEEgCwAAAAC/explosion.gif")
          .setTimestamp()],
      });
    } catch {
      await interaction.editReply({ content: "Failed to nuke the channel. Check my permissions." });
    }
  },
};

export default command;
