import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, TextChannel, ChannelType } from "discord.js";
import type { Command } from "../../client";
import { sendModLog } from "../../utils/modLog";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock or unlock a channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(s => s.setName("channel").setDescription("Lock the current channel")
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false)))
    .addSubcommand(s => s.setName("unlock").setDescription("Unlock the current channel")
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false))),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const channel = interaction.channel as TextChannel;

    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.reply({ content: "This command only works in text channels.", ephemeral: true });
      return;
    }

    const everyoneRole = interaction.guild?.roles.everyone;
    if (!everyoneRole) return;

    try {
      if (sub === "channel") {
        await channel.permissionOverwrites.edit(everyoneRole, { SendMessages: false });
        await interaction.reply({ content: `🔒 Channel locked. Reason: ${reason}` });
        await sendModLog(interaction.client, interaction.guildId!, "LOCK", `#${channel.name}`, interaction.user.tag, reason);
      } else {
        await channel.permissionOverwrites.edit(everyoneRole, { SendMessages: null });
        await interaction.reply({ content: `🔓 Channel unlocked. Reason: ${reason}` });
        await sendModLog(interaction.client, interaction.guildId!, "UNLOCK", `#${channel.name}`, interaction.user.tag, reason);
      }
    } catch {
      await interaction.reply({ content: "Failed to update channel permissions.", ephemeral: true });
    }
  },
};

export default command;
