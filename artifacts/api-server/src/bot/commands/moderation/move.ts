import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ChannelType, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("move")
    .setDescription("Move a member to a different voice channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
    .addUserOption(o => o.setName("user").setDescription("Member to move").setRequired(true))
    .addChannelOption(o => o.setName("channel").setDescription("Target voice channel").addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice).setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const channel = interaction.options.getChannel("channel", true);
    const member = interaction.guild?.members.cache.get(target.id) ?? await interaction.guild?.members.fetch(target.id).catch(() => null);

    if (!member) { await interaction.reply({ content: "Member not found.", ephemeral: true }); return; }
    if (!member.voice.channel) { await interaction.reply({ content: `**${target.tag}** is not in a voice channel.`, ephemeral: true }); return; }

    const from = member.voice.channel.name;
    await member.voice.setChannel(channel.id, `Moved by ${interaction.user.tag}`);

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle("🎙️ Member Moved")
        .addFields(
          { name: "Member", value: target.tag, inline: true },
          { name: "From", value: from, inline: true },
          { name: "To", value: channel.name ?? channel.id, inline: true },
        ).setTimestamp()],
    });
  },
};

export default command;
