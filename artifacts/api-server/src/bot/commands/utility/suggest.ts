import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, SlashCommandStringOption, SlashCommandIntegerOption, SlashCommandChannelOption } from "discord.js";
import type { Command } from "../../client";
import { setSuggestionChannel, getSuggestionChannel, createSuggestion, getSuggestion, updateSuggestionStatus, listSuggestions } from "../../db/suggestions";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Suggestion system")
    .addSubcommand(s => s.setName("idea").setDescription("Submit a suggestion")
      .addStringOption((o: SlashCommandStringOption) => o.setName("suggestion").setDescription("Your idea or suggestion").setRequired(true).setMaxLength(1024)))
    .addSubcommand(s => s.setName("setup").setDescription("Set the suggestions channel (Mod only)")
      .addChannelOption((o: SlashCommandChannelOption) => o.setName("channel").setDescription("Where suggestions will be posted").setRequired(true)))
    .addSubcommand(s => s.setName("approve").setDescription("Approve a suggestion (Mod only)")
      .addIntegerOption((o: SlashCommandIntegerOption) => o.setName("id").setDescription("Suggestion ID").setRequired(true))
      .addStringOption((o: SlashCommandStringOption) => o.setName("response").setDescription("Response message").setRequired(false)))
    .addSubcommand(s => s.setName("deny").setDescription("Deny a suggestion (Mod only)")
      .addIntegerOption((o: SlashCommandIntegerOption) => o.setName("id").setDescription("Suggestion ID").setRequired(true))
      .addStringOption((o: SlashCommandStringOption) => o.setName("response").setDescription("Reason for denial").setRequired(false)))
    .addSubcommand(s => s.setName("list").setDescription("List recent suggestions (Mod only)")
      .addStringOption((o: SlashCommandStringOption) => o.setName("status").setDescription("Filter by status").setRequired(false).addChoices(
        { name: "Pending", value: "pending" },
        { name: "Approved", value: "approved" },
        { name: "Denied", value: "denied" },
      ))),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel", true);
      setSuggestionChannel(guildId, channel.id);
      await interaction.reply({ content: `Suggestion channel set to <#${channel.id}>. Members can now use \`/suggest idea\`.` });

    } else if (sub === "idea") {
      const channelId = getSuggestionChannel(guildId);
      if (!channelId) { await interaction.reply({ content: "No suggestion channel configured. Ask an admin to run `/suggest setup`.", ephemeral: true }); return; }
      const ch = interaction.guild?.channels.cache.get(channelId);
      if (!ch?.isTextBased()) { await interaction.reply({ content: "Suggestion channel not found.", ephemeral: true }); return; }

      const content = interaction.options.getString("suggestion", true);
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("💡 New Suggestion")
        .setDescription(content)
        .addFields({ name: "Submitted by", value: `${interaction.user.tag}`, inline: true })
        .setTimestamp();

      const msg = await ch.send({ embeds: [embed] });
      await msg.react("✅").catch(() => {});
      await msg.react("❌").catch(() => {});

      const id = createSuggestion(guildId, channelId, msg.id, interaction.user.id, content);
      await msg.edit({ embeds: [embed.setFooter({ text: `Suggestion #${id}` })] }).catch(() => {});
      await interaction.reply({ content: `Your suggestion has been submitted as **#${id}**!`, ephemeral: true });

    } else if (sub === "approve" || sub === "deny") {
      const id = interaction.options.getInteger("id", true);
      const response = interaction.options.getString("response") ?? (sub === "approve" ? "Approved!" : "Not approved at this time.");
      const suggestion = getSuggestion(guildId, id);
      if (!suggestion) { await interaction.reply({ content: `Suggestion #${id} not found.`, ephemeral: true }); return; }

      updateSuggestionStatus(id, sub === "approve" ? "approved" : "denied", response);
      const color = sub === "approve" ? 0x00cc66 : 0xff4444;
      const label = sub === "approve" ? "✅ Approved" : "❌ Denied";

      const ch = interaction.guild?.channels.cache.get(suggestion.channel_id);
      if (ch?.isTextBased()) {
        const msg = await ch.messages.fetch(suggestion.message_id).catch(() => null);
        if (msg) {
          const updated = EmbedBuilder.from(msg.embeds[0] ?? {})
            .setColor(color)
            .setTitle(`💡 Suggestion — ${label}`)
            .setFields(
              { name: "Submitted by", value: `<@${suggestion.user_id}>`, inline: true },
              { name: label, value: response },
              { name: "Reviewed by", value: interaction.user.tag, inline: true },
            );
          await msg.edit({ embeds: [updated] }).catch(() => {});
        }
      }
      await interaction.reply({ content: `Suggestion #${id} has been **${sub === "approve" ? "approved" : "denied"}**.` });

    } else {
      const status = interaction.options.getString("status") ?? undefined;
      const suggestions = listSuggestions(guildId, status);
      if (suggestions.length === 0) { await interaction.reply({ content: "No suggestions found.", ephemeral: true }); return; }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Suggestions")
        .setDescription(suggestions.map(s => `**#${s.id}** [${s.status.toUpperCase()}] <@${s.user_id}>\n${s.content.slice(0, 80)}${s.content.length > 80 ? "…" : ""}`).join("\n\n"))
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

export default command;
