import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { getAutoModConfig, setAutoModConfig } from "../../utils/guildConfig";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Configure auto-moderation settings")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Configure auto-mod settings")
        .addBooleanOption((opt) =>
          opt.setName("anti_spam").setDescription("Block repeated messages").setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt.setName("anti_invite").setDescription("Block Discord invite links").setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt.setName("anti_caps").setDescription("Block excessive caps (>70%)").setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt.setName("anti_mention").setDescription("Block mass mentions (5+)").setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt.setName("anti_links").setDescription("Block all external links").setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("View current auto-mod configuration")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "setup") {
      const current = getAutoModConfig(guildId);
      const updated = {
        antiSpam: interaction.options.getBoolean("anti_spam") ?? current.antiSpam,
        antiInvite: interaction.options.getBoolean("anti_invite") ?? current.antiInvite,
        antiCaps: interaction.options.getBoolean("anti_caps") ?? current.antiCaps,
        antiMention: interaction.options.getBoolean("anti_mention") ?? current.antiMention,
        antiLinks: interaction.options.getBoolean("anti_links") ?? current.antiLinks,
      };

      setAutoModConfig(guildId, updated);

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Auto-Mod Configuration Updated")
        .addFields(
          { name: "Anti-Spam", value: updated.antiSpam ? "Enabled" : "Disabled", inline: true },
          { name: "Anti-Invite", value: updated.antiInvite ? "Enabled" : "Disabled", inline: true },
          { name: "Anti-Caps", value: updated.antiCaps ? "Enabled" : "Disabled", inline: true },
          { name: "Anti-Mention", value: updated.antiMention ? "Enabled" : "Disabled", inline: true },
          { name: "Anti-Links", value: updated.antiLinks ? "Enabled" : "Disabled", inline: true },
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else {
      const config = getAutoModConfig(guildId);
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Auto-Mod Status")
        .addFields(
          { name: "Anti-Spam", value: config.antiSpam ? "Enabled" : "Disabled", inline: true },
          { name: "Anti-Invite", value: config.antiInvite ? "Enabled" : "Disabled", inline: true },
          { name: "Anti-Caps", value: config.antiCaps ? "Enabled" : "Disabled", inline: true },
          { name: "Anti-Mention", value: config.antiMention ? "Enabled" : "Disabled", inline: true },
          { name: "Anti-Links", value: config.antiLinks ? "Enabled" : "Disabled", inline: true },
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
