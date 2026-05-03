import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, ChannelType } from "discord.js";
import type { Command } from "../../client";
import { getStarboardConfig, setStarboardConfig } from "../../db/starboard";
import { db } from "../../db/database";

interface StarboardMessage {
  original_message_id: string;
  channel_id: string;
  starboard_message_id: string;
  star_count: number;
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("starboard")
    .setDescription("Configure the starboard")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("setup").setDescription("Set the starboard channel and threshold")
      .addChannelOption(o => o.setName("channel").setDescription("Starboard channel").addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addIntegerOption(o => o.setName("threshold").setDescription("Stars needed (default: 3)").setMinValue(1).setRequired(false))
      .addStringOption(o => o.setName("emoji").setDescription("Reaction emoji (default: ⭐)").setRequired(false)))
    .addSubcommand(s => s.setName("disable").setDescription("Disable the starboard"))
    .addSubcommand(s => s.setName("enable").setDescription("Re-enable the starboard"))
    .addSubcommand(s => s.setName("status").setDescription("Show starboard config"))
    .addSubcommand(s => s.setName("leaderboard").setDescription("Top 10 most-starred messages")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel", true);
      const threshold = interaction.options.getInteger("threshold") ?? 3;
      const emoji = interaction.options.getString("emoji") ?? "⭐";
      setStarboardConfig(guildId, { channel_id: channel.id, threshold, emoji, enabled: 1 });
      await interaction.reply({ content: `Starboard set to <#${channel.id}> — ${emoji} × ${threshold} to star a message.` });

    } else if (sub === "disable") {
      setStarboardConfig(guildId, { enabled: 0 });
      await interaction.reply({ content: "Starboard disabled." });

    } else if (sub === "enable") {
      setStarboardConfig(guildId, { enabled: 1 });
      await interaction.reply({ content: "Starboard enabled." });

    } else if (sub === "leaderboard") {
      const top = db.prepare(
        "SELECT * FROM starboard_messages WHERE guild_id = ? ORDER BY star_count DESC LIMIT 10"
      ).all(guildId) as unknown as StarboardMessage[];
      const config = getStarboardConfig(guildId);

      if (top.length === 0) {
        await interaction.reply({ content: "No starred messages yet.", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle(`${config.emoji} Starboard Leaderboard`)
        .setDescription(top.map((m, i) =>
          `**${i + 1}.** ${config.emoji} × **${m.star_count}** in <#${m.channel_id}> — [Jump](https://discord.com/channels/${guildId}/${m.channel_id}/${m.original_message_id})`
        ).join("\n"))
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });

    } else {
      const c = getStarboardConfig(guildId);
      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("Starboard Config")
        .addFields(
          { name: "Status", value: c.enabled ? "Enabled" : "Disabled", inline: true },
          { name: "Channel", value: c.channel_id ? `<#${c.channel_id}>` : "Not set", inline: true },
          { name: "Threshold", value: `${c.threshold} × ${c.emoji}`, inline: true },
        ).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
