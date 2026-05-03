import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, AttachmentBuilder } from "discord.js";
import type { Command } from "../../client";
import { getConfig } from "../../db/guildConfig";
import { getEscalationRules } from "../../db/escalation";
import { getRaidConfig } from "../../db/raidProtection";
import { getTicketConfig } from "../../db/tickets";
import { getStarboardConfig } from "../../db/starboard";
import { getModmailConfig } from "../../db/modmail";
import { getAutoThreadChannels } from "../../db/autoThread";
import { getStatsChannels } from "../../db/statsChannels";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("backup")
    .setDescription("Export this server's bot configuration as a JSON file")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    await interaction.deferReply({ ephemeral: true });

    const backup = {
      exported_at: new Date().toISOString(),
      guild_id: guildId,
      guild_name: interaction.guild?.name,
      config: getConfig(guildId),
      escalation_rules: getEscalationRules(guildId),
      raid_config: getRaidConfig(guildId),
      ticket_config: getTicketConfig(guildId),
      starboard_config: getStarboardConfig(guildId),
      modmail_config: getModmailConfig(guildId),
      auto_thread_channels: getAutoThreadChannels(guildId),
      stats_channels: getStatsChannels(guildId),
    };

    const json = JSON.stringify(backup, null, 2);
    const buffer = Buffer.from(json, "utf-8");
    const file = new AttachmentBuilder(buffer, { name: `backup-${guildId}-${Date.now()}.json` });

    await interaction.editReply({
      content: "Here is your server configuration backup. Keep it safe — it contains channel IDs and role IDs for this server.",
      files: [file],
    });
  },
};

export default command;
