import { Client, EmbedBuilder, TextChannel } from "discord.js";
import { getExpiredGiveaways, endGiveaway, Giveaway } from "../db/giveaways";
import { botLogger } from "../logger";

async function drawGiveaway(client: Client, giveaway: Giveaway): Promise<void> {
  try {
    const guild = client.guilds.cache.get(giveaway.guild_id);
    if (!guild) return;
    const channel = guild.channels.cache.get(giveaway.channel_id) as TextChannel | undefined;
    if (!channel || !giveaway.message_id) return;

    const message = await channel.messages.fetch(giveaway.message_id).catch(() => null);
    if (!message) return;

    const reaction = message.reactions.cache.get("🎉");
    let users = reaction ? await reaction.users.fetch().catch(() => null) : null;
    const eligible = users ? [...users.values()].filter(u => !u.bot) : [];

    const winners: string[] = [];
    const pool = [...eligible];
    for (let i = 0; i < giveaway.winner_count && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      winners.push(pool[idx].id);
      pool.splice(idx, 1);
    }

    endGiveaway(giveaway.id, winners);

    const embed = new EmbedBuilder()
      .setColor(winners.length > 0 ? 0xffd700 : 0x888888)
      .setTitle("🎉 Giveaway Ended!")
      .addFields(
        { name: "Prize", value: giveaway.prize },
        { name: "Winners", value: winners.length > 0 ? winners.map(id => `<@${id}>`).join(", ") : "No eligible participants" },
        { name: "Hosted By", value: `<@${giveaway.host_id}>`, inline: true },
      )
      .setTimestamp();

    await message.edit({ content: "🎉 **GIVEAWAY ENDED** 🎉", embeds: [embed], components: [] });

    if (winners.length > 0) {
      await channel.send(`🎉 Congratulations ${winners.map(id => `<@${id}>`).join(", ")}! You won **${giveaway.prize}**!`);
    } else {
      await channel.send(`The giveaway for **${giveaway.prize}** ended with no eligible participants.`);
    }
  } catch (err) {
    botLogger.warn({ err, giveawayId: giveaway.id }, "Failed to draw giveaway");
  }
}

export function startGiveawayChecker(client: Client): void {
  setInterval(async () => {
    const expired = getExpiredGiveaways();
    for (const g of expired) {
      await drawGiveaway(client, g);
    }
  }, 15_000);
}

export async function drawGiveawayNow(client: Client, giveaway: Giveaway): Promise<void> {
  await drawGiveaway(client, giveaway);
}
