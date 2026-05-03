import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, TextChannel } from "discord.js";
import type { Command } from "../../client";
import { isRaidLocked, manualUnlock } from "../../utils/raidProtectionHandler";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("raidmode")
    .setDescription("Manually lock or unlock the server against raids")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("on").setDescription("Lock all channels (raid mode on)"))
    .addSubcommand(s => s.setName("off").setDescription("Unlock all channels (raid mode off)"))
    .addSubcommand(s => s.setName("status").setDescription("Check whether raid mode is active")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild!;
    const guildId = guild.id;

    if (sub === "status") {
      const locked = isRaidLocked(guildId);
      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(locked ? 0xff0000 : 0x00cc66)
          .setTitle(locked ? "🔴 Raid Mode: ACTIVE" : "🟢 Raid Mode: Inactive")
          .setDescription(locked ? "Server channels are locked. Use `/raidmode off` to unlock." : "Server is operating normally.")
          .setTimestamp()],
        ephemeral: true,
      });
      return;
    }

    if (sub === "on") {
      await interaction.deferReply({ ephemeral: true });
      let count = 0;
      for (const channel of guild.channels.cache.values()) {
        if (channel.isTextBased() && "permissionOverwrites" in channel) {
          await channel.permissionOverwrites.edit(guild.roles.everyone, {
            SendMessages: false,
          }).catch(() => {});
          count++;
        }
      }
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("🔴 Raid Mode Enabled")
        .setDescription(`**${count}** text channels locked by ${interaction.user.tag}.\nUse \`/raidmode off\` to unlock.`)
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });

    } else {
      await interaction.deferReply({ ephemeral: true });
      manualUnlock(guildId);
      let count = 0;
      for (const channel of guild.channels.cache.values()) {
        if (channel.isTextBased() && "permissionOverwrites" in channel) {
          await channel.permissionOverwrites.edit(guild.roles.everyone, {
            SendMessages: null,
          }).catch(() => {});
          count++;
        }
      }
      const embed = new EmbedBuilder()
        .setColor(0x00cc66)
        .setTitle("🟢 Raid Mode Disabled")
        .setDescription(`**${count}** channels unlocked by ${interaction.user.tag}.`)
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    }
  },
};

export default command;
