import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, ChannelType, TextChannel } from "discord.js";
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
    .addSubcommand(s => s.setName("reroll").setDescription("Pick new winners for a finished giveaway")
      .addStringOption(o => o.setName("message_id").setDescription("Message ID of the ended giveaway").setRequired(true))
      .addIntegerOption(o => o.setName("winners").setDescription("How many new winners to pick (default: same as original)").setMinValue(1).setMaxValue(20).setRequired(false)))
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
        .setFooter({ text: "Ends at" })
        .setTimestamp(endsAt * 1000);

      const targetChannel = interaction.guild?.channels.cache.get(channel!.id);
      if (!targetChannel?.isTextBased()) { await interaction.editReply({ content: "Invalid channel." }); return; }

      const giveawayId = createGiveaway({
        guildId, channelId: channel!.id, prize, winnerCount,
        hostId: interaction.user.id, hostTag: interaction.user.tag, endsAt,
      });

      const msg = await (targetChannel as TextChannel).send({ content: "🎉 **GIVEAWAY** 🎉", embeds: [embed] });
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

    } else if (sub === "reroll") {
      const messageId = interaction.options.getString("message_id", true);
      const giveaway = getGiveawayByMessage(messageId);
      if (!giveaway || !giveaway.ended) {
        await interaction.reply({ content: "Giveaway not found or hasn't ended yet. Use `/giveaway end` first.", ephemeral: true });
        return;
      }
      await interaction.deferReply({ ephemeral: true });

      const overrideWinners = interaction.options.getInteger("winners") ?? giveaway.winner_count;
      const guild = interaction.guild!;
      const channel = guild.channels.cache.get(giveaway.channel_id) as TextChannel | undefined;
      if (!channel || !giveaway.message_id) {
        await interaction.editReply({ content: "Could not find the giveaway message." });
        return;
      }

      const message = await channel.messages.fetch(giveaway.message_id).catch(() => null);
      if (!message) { await interaction.editReply({ content: "Giveaway message not found." }); return; }

      const reaction = message.reactions.cache.get("🎉");
      const users = reaction ? await reaction.users.fetch().catch(() => null) : null;
      const eligible = users ? [...users.values()].filter(u => !u.bot) : [];

      const winners: string[] = [];
      const pool = [...eligible];
      for (let i = 0; i < overrideWinners && pool.length > 0; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        winners.push(pool[idx].id);
        pool.splice(idx, 1);
      }

      if (winners.length === 0) {
        await interaction.editReply({ content: "No eligible participants to reroll." });
        return;
      }

      await channel.send(`🎉 **Giveaway Reroll!** New winner(s) for **${giveaway.prize}**: ${winners.map(id => `<@${id}>`).join(", ")} — congratulations!`);
      await interaction.editReply({ content: `Rerolled! New winners: ${winners.map(id => `<@${id}>`).join(", ")}` });

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
