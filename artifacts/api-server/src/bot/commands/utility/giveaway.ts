import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, ChannelType } from "discord.js";
import type { Command } from "../../client";
import { createGiveaway, setGiveawayMessageId, getActiveGiveawaysByGuild, getGiveawayByMessage, endGiveaway } from "../../db/giveaways";
import { drawGiveawayNow } from "../../utils/giveawayManager";

function parseDuration(str: string): number | null {
  const match = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const n = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return n * multipliers[unit];
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Manage giveaways")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addSubcommand(s => s.setName("start").setDescription("Start a new giveaway")
      .addStringOption(o => o.setName("duration").setDescription("Duration e.g. 1h, 30m, 2d").setRequired(true))
      .addStringOption(o => o.setName("prize").setDescription("What the winner gets").setRequired(true))
      .addIntegerOption(o => o.setName("winners").setDescription("Number of winners (default: 1)").setMinValue(1).setMaxValue(20).setRequired(false))
      .addChannelOption(o => o.setName("channel").setDescription("Channel to host in (default: current)").addChannelTypes(ChannelType.GuildText).setRequired(false)))
    .addSubcommand(s => s.setName("end").setDescription("End a giveaway early")
      .addStringOption(o => o.setName("message_id").setDescription("Message ID of the giveaway").setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("List active giveaways")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "start") {
      const durationStr = interaction.options.getString("duration", true);
      const prize = interaction.options.getString("prize", true);
      const winnerCount = interaction.options.getInteger("winners") ?? 1;
      const channel = interaction.options.getChannel("channel") ?? interaction.channel;

      const durationSecs = parseDuration(durationStr);
      if (!durationSecs) {
        await interaction.reply({ content: "Invalid duration. Use format like `1h`, `30m`, `2d`.", ephemeral: true });
        return;
      }

      const endsAt = Math.floor(Date.now() / 1000) + durationSecs;
      await interaction.deferReply({ ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("🎉 GIVEAWAY 🎉")
        .addFields(
          { name: "Prize", value: `**${prize}**` },
          { name: "Winners", value: `${winnerCount}`, inline: true },
          { name: "Ends", value: `<t:${endsAt}:R>`, inline: true },
          { name: "Hosted By", value: interaction.user.tag, inline: true },
        )
        .setDescription("React with 🎉 to enter!")
        .setFooter({ text: `Ends at` })
        .setTimestamp(endsAt * 1000);

      const targetChannel = interaction.guild?.channels.cache.get(channel!.id);
      if (!targetChannel?.isTextBased()) { await interaction.editReply({ content: "Invalid channel." }); return; }

      const giveawayId = createGiveaway({
        guildId, channelId: channel!.id, prize, winnerCount,
        hostId: interaction.user.id, hostTag: interaction.user.tag, endsAt,
      });

      const msg = await (targetChannel as import("discord.js").TextChannel).send({ content: "🎉 **GIVEAWAY** 🎉", embeds: [embed] });
      await msg.react("🎉");
      setGiveawayMessageId(giveawayId, msg.id);
      await interaction.editReply({ content: `Giveaway started in <#${channel!.id}> for **${prize}**! Ends <t:${endsAt}:R>.` });

    } else if (sub === "end") {
      const messageId = interaction.options.getString("message_id", true);
      const giveaway = getGiveawayByMessage(messageId);
      if (!giveaway || giveaway.ended) {
        await interaction.reply({ content: "Giveaway not found or already ended.", ephemeral: true });
        return;
      }
      await interaction.deferReply({ ephemeral: true });
      await drawGiveawayNow(interaction.client, giveaway);
      await interaction.editReply({ content: "Giveaway ended and winners drawn." });

    } else {
      const giveaways = getActiveGiveawaysByGuild(guildId);
      if (giveaways.length === 0) {
        await interaction.reply({ content: "No active giveaways.", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("Active Giveaways")
        .setDescription(giveaways.map(g => `**${g.prize}** — ${g.winner_count} winner(s) — Ends <t:${g.ends_at}:R>\nChannel: <#${g.channel_id}>`).join("\n\n"))
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

export default command;
