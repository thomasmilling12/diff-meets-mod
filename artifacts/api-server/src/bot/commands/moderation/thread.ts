import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ThreadChannel, ChannelType, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("thread")
    .setDescription("Manage Discord threads")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageThreads)
    .addSubcommand(s => s.setName("close").setDescription("Archive a thread")
      .addChannelOption(o => o.setName("thread").setDescription("Thread to close (default: current)").addChannelTypes(ChannelType.PublicThread, ChannelType.PrivateThread).setRequired(false))
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false)))
    .addSubcommand(s => s.setName("lock").setDescription("Lock a thread (archived + locked)")
      .addChannelOption(o => o.setName("thread").setDescription("Thread to lock (default: current)").addChannelTypes(ChannelType.PublicThread, ChannelType.PrivateThread).setRequired(false))
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false)))
    .addSubcommand(s => s.setName("rename").setDescription("Rename a thread")
      .addStringOption(o => o.setName("name").setDescription("New thread name").setRequired(true).setMaxLength(100))
      .addChannelOption(o => o.setName("thread").setDescription("Thread to rename (default: current)").addChannelTypes(ChannelType.PublicThread, ChannelType.PrivateThread).setRequired(false)))
    .addSubcommand(s => s.setName("slow").setDescription("Set slowmode in a thread")
      .addIntegerOption(o => o.setName("seconds").setDescription("Slowmode in seconds (0 to disable)").setMinValue(0).setMaxValue(21600).setRequired(true))
      .addChannelOption(o => o.setName("thread").setDescription("Thread (default: current)").addChannelTypes(ChannelType.PublicThread, ChannelType.PrivateThread).setRequired(false)))
    .addSubcommand(s => s.setName("open").setDescription("Unarchive a thread")
      .addChannelOption(o => o.setName("thread").setDescription("Thread to open").addChannelTypes(ChannelType.PublicThread, ChannelType.PrivateThread).setRequired(true))),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const rawThread = interaction.options.getChannel("thread") ?? (interaction.channel?.isThread() ? interaction.channel : null);

    const getThread = () => {
      if (!rawThread) return null;
      return interaction.guild?.channels.cache.get(rawThread.id) as ThreadChannel | undefined;
    };

    if (sub === "close") {
      const thread = getThread();
      if (!thread?.isThread()) { await interaction.reply({ content: "No thread found. Run this inside a thread or specify one.", ephemeral: true }); return; }
      const reason = interaction.options.getString("reason") ?? `Closed by ${interaction.user.tag}`;
      await thread.setArchived(true, reason);
      await interaction.reply({ content: `Thread **${thread.name}** has been closed.` });

    } else if (sub === "lock") {
      const thread = getThread();
      if (!thread?.isThread()) { await interaction.reply({ content: "No thread found.", ephemeral: true }); return; }
      const reason = interaction.options.getString("reason") ?? `Locked by ${interaction.user.tag}`;
      await thread.setLocked(true, reason);
      await thread.setArchived(true, reason);
      await interaction.reply({ content: `Thread **${thread.name}** has been locked and archived.` });

    } else if (sub === "rename") {
      const thread = getThread();
      if (!thread?.isThread()) { await interaction.reply({ content: "No thread found.", ephemeral: true }); return; }
      const name = interaction.options.getString("name", true);
      const old = thread.name;
      await thread.setName(name, `Renamed by ${interaction.user.tag}`);
      await interaction.reply({ content: `Thread renamed: **${old}** → **${name}**` });

    } else if (sub === "slow") {
      const thread = getThread();
      if (!thread?.isThread()) { await interaction.reply({ content: "No thread found.", ephemeral: true }); return; }
      const secs = interaction.options.getInteger("seconds", true);
      await thread.setRateLimitPerUser(secs, `Set by ${interaction.user.tag}`);
      await interaction.reply({ content: secs > 0 ? `Slowmode set to **${secs}s** in **${thread.name}**.` : `Slowmode disabled in **${thread.name}**.` });

    } else {
      const thread = getThread();
      if (!thread?.isThread()) { await interaction.reply({ content: "No thread found.", ephemeral: true }); return; }
      await thread.setArchived(false, `Opened by ${interaction.user.tag}`);
      await interaction.reply({ content: `Thread **${thread.name}** has been reopened.` });
    }
  },
};

export default command;
