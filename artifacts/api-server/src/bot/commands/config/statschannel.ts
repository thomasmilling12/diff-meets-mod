import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ChannelType, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { addStatsChannel, removeStatsChannel, getStatsChannels } from "../../db/statsChannels";

const DEFAULT_FORMATS: Record<string, string> = {
  members: "Members: {value}",
  online: "Online: {value}",
  bots: "Bots: {value}",
  channels: "Channels: {value}",
  boosts: "Boosts: {value}",
};

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("stats-channel")
    .setDescription("Manage auto-updating stat voice channels")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("add").setDescription("Create a new stats channel")
      .addStringOption(o => o.setName("type").setDescription("What stat to show").setRequired(true)
        .addChoices(
          { name: "Total Members", value: "members" },
          { name: "Online Members", value: "online" },
          { name: "Bots", value: "bots" },
          { name: "Channels", value: "channels" },
          { name: "Boosts", value: "boosts" },
        ))
      .addStringOption(o => o.setName("format").setDescription("Name format, use {value} as placeholder. E.g. 'Members: {value}'").setRequired(false)))
    .addSubcommand(s => s.setName("remove").setDescription("Remove a stats channel")
      .addStringOption(o => o.setName("type").setDescription("Type to remove").setRequired(true)
        .addChoices(
          { name: "members", value: "members" }, { name: "online", value: "online" },
          { name: "bots", value: "bots" }, { name: "channels", value: "channels" }, { name: "boosts", value: "boosts" },
        )))
    .addSubcommand(s => s.setName("list").setDescription("List all stats channels")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;
    await interaction.deferReply();

    if (sub === "add") {
      const type = interaction.options.getString("type", true);
      const format = interaction.options.getString("format") ?? DEFAULT_FORMATS[type] ?? `${type}: {value}`;
      const initialName = format.replace("{value}", "...");

      try {
        const channel = await interaction.guild!.channels.create({
          name: initialName,
          type: ChannelType.GuildVoice,
          permissionOverwrites: [
            { id: interaction.guild!.roles.everyone, deny: ["Connect", "Speak"] },
          ],
        });
        addStatsChannel(guildId, channel.id, type, format);
        await interaction.editReply({ content: `Stats channel created: <#${channel.id}>\nIt will update every 10 minutes.` });
      } catch {
        await interaction.editReply({ content: "Failed to create the stats channel. Make sure I have permission to manage channels." });
      }
    } else if (sub === "remove") {
      const type = interaction.options.getString("type", true);
      const channels = getStatsChannels(guildId);
      const sc = channels.find(c => c.type === type);
      const removed = removeStatsChannel(guildId, type);
      if (sc) {
        const channel = interaction.guild?.channels.cache.get(sc.channel_id);
        await channel?.delete().catch(() => {});
      }
      await interaction.editReply({ content: removed ? `Removed **${type}** stats channel.` : `No stats channel of type **${type}** found.` });
    } else {
      const channels = getStatsChannels(guildId);
      if (channels.length === 0) {
        await interaction.editReply({ content: "No stats channels configured." });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Stats Channels")
        .setDescription(channels.map(c => `**${c.type}** → <#${c.channel_id}>\nFormat: \`${c.format}\``).join("\n\n"))
        .setFooter({ text: "Updates every 10 minutes" })
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }
  },
};

export default command;
