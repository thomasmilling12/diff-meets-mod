import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, ChannelType } from "discord.js";
import type { Command } from "../../client";
import { setSticky, clearSticky, getGuildStickyChannels } from "../../db/stickyMessages";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("sticky")
    .setDescription("Pin a message that always re-posts at the bottom of a channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(s => s.setName("set").setDescription("Set a sticky message in a channel")
      .addStringOption(o => o.setName("message").setDescription("Content of the sticky message").setRequired(true).setMaxLength(2000))
      .addChannelOption(o => o.setName("channel").setDescription("Channel (default: current)").addChannelTypes(ChannelType.GuildText).setRequired(false)))
    .addSubcommand(s => s.setName("clear").setDescription("Remove the sticky message from a channel")
      .addChannelOption(o => o.setName("channel").setDescription("Channel (default: current)").addChannelTypes(ChannelType.GuildText).setRequired(false)))
    .addSubcommand(s => s.setName("list").setDescription("List all sticky messages in this server")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;
    const channel = interaction.options.getChannel("channel") ?? interaction.channel;

    if (sub === "set") {
      const content = interaction.options.getString("message", true);
      setSticky(guildId, channel!.id, content);
      await interaction.reply({ content: `Sticky message set in <#${channel!.id}>. It will re-post whenever someone sends a message there.` });

    } else if (sub === "clear") {
      const removed = clearSticky(guildId, channel!.id);
      await interaction.reply({ content: removed ? `Sticky message cleared from <#${channel!.id}>.` : "No sticky message found for that channel.", ephemeral: !removed });

    } else {
      const stickies = getGuildStickyChannels(guildId);
      if (stickies.length === 0) {
        await interaction.reply({ content: "No sticky messages configured.", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Sticky Messages")
        .setDescription(stickies.map(s => `<#${s.channel_id}>\n\`\`\`${s.content.slice(0, 80)}${s.content.length > 80 ? "…" : ""}\`\`\``).join("\n"))
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

export default command;
