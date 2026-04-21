import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { getConfig, setAutoMod } from "../../db/guildConfig";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Configure auto-moderation settings")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("setup").setDescription("Configure auto-mod settings")
      .addBooleanOption(o => o.setName("anti_spam").setDescription("Block repeated messages").setRequired(false))
      .addBooleanOption(o => o.setName("anti_invite").setDescription("Block Discord invite links").setRequired(false))
      .addBooleanOption(o => o.setName("anti_caps").setDescription("Block excessive caps (>70%)").setRequired(false))
      .addBooleanOption(o => o.setName("anti_mention").setDescription("Block mass mentions (5+)").setRequired(false))
      .addBooleanOption(o => o.setName("anti_links").setDescription("Block all external links").setRequired(false))
      .addBooleanOption(o => o.setName("anti_phishing").setDescription("Block phishing links (recommended)").setRequired(false)))
    .addSubcommand(s => s.setName("status").setDescription("View current auto-mod configuration")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "setup") {
      const settings: Record<string, boolean | undefined> = {
        antiSpam: interaction.options.getBoolean("anti_spam") ?? undefined,
        antiInvite: interaction.options.getBoolean("anti_invite") ?? undefined,
        antiCaps: interaction.options.getBoolean("anti_caps") ?? undefined,
        antiMention: interaction.options.getBoolean("anti_mention") ?? undefined,
        antiLinks: interaction.options.getBoolean("anti_links") ?? undefined,
        antiPhishing: interaction.options.getBoolean("anti_phishing") ?? undefined,
      };

      const filtered: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(settings)) {
        if (v !== undefined) filtered[k] = v;
      }

      setAutoMod(guildId, filtered);
      const config = getConfig(guildId);

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Auto-Mod Updated")
        .addFields(
          { name: "Anti-Spam", value: config.automod_anti_spam ? "Enabled" : "Disabled", inline: true },
          { name: "Anti-Invite", value: config.automod_anti_invite ? "Enabled" : "Disabled", inline: true },
          { name: "Anti-Caps", value: config.automod_anti_caps ? "Enabled" : "Disabled", inline: true },
          { name: "Anti-Mention", value: config.automod_anti_mention ? "Enabled" : "Disabled", inline: true },
          { name: "Anti-Links", value: config.automod_anti_links ? "Enabled" : "Disabled", inline: true },
          { name: "Anti-Phishing", value: config.automod_anti_phishing ? "Enabled" : "Disabled", inline: true },
        ).setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else {
      const config = getConfig(guildId);
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Auto-Mod Status")
        .addFields(
          { name: "Anti-Spam", value: config.automod_anti_spam ? "Enabled" : "Disabled", inline: true },
          { name: "Anti-Invite", value: config.automod_anti_invite ? "Enabled" : "Disabled", inline: true },
          { name: "Anti-Caps", value: config.automod_anti_caps ? "Enabled" : "Disabled", inline: true },
          { name: "Anti-Mention", value: config.automod_anti_mention ? "Enabled" : "Disabled", inline: true },
          { name: "Anti-Links", value: config.automod_anti_links ? "Enabled" : "Disabled", inline: true },
          { name: "Anti-Phishing", value: config.automod_anti_phishing ? "Enabled" : "Disabled", inline: true },
        ).setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
