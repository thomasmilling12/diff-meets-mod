import { ChatInputCommandInteraction, EmbedBuilder, TextChannel, ButtonInteraction } from "discord.js";
import type { Ticket, TicketConfig } from "../db/tickets";

export async function generateTranscript(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  ticket: Ticket,
  config: TicketConfig,
  reason: string,
): Promise<void> {
  try {
    const channel = interaction.channel as TextChannel;
    const messages = await channel.messages.fetch({ limit: 100 });
    const sorted = [...messages.values()].reverse();

    const lines = sorted
      .filter(m => !m.author.bot || m.embeds.length === 0)
      .map(m => `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content || "[embed/attachment]"}`);

    const transcript = lines.join("\n") || "(no messages)";

    if (config.log_channel_id) {
      const logChannel = interaction.guild?.channels.cache.get(config.log_channel_id) as TextChannel | undefined;
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setColor(0xff6666)
          .setTitle(`Ticket #${ticket.id} Closed`)
          .addFields(
            { name: "Opened By", value: `${ticket.user_tag} (${ticket.user_id})`, inline: true },
            { name: "Closed By", value: interaction.user.tag, inline: true },
            { name: "Reason", value: reason },
            { name: "Created", value: `<t:${ticket.created_at}:F>`, inline: true },
            { name: "Messages", value: `${lines.length}`, inline: true },
          )
          .setTimestamp();

        const { AttachmentBuilder } = await import("discord.js");
        const buffer = Buffer.from(transcript, "utf-8");
        const attachment = new AttachmentBuilder(buffer, { name: `ticket-${ticket.id}-transcript.txt` });
        await logChannel.send({ embeds: [embed], files: [attachment] }).catch(() => {});
      }
    }
  } catch { /* skip transcript on error */ }
}
