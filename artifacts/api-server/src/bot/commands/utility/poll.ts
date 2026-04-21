import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";

const EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Create a poll with reaction voting")
    .addStringOption(o => o.setName("question").setDescription("The poll question").setRequired(true))
    .addStringOption(o => o.setName("option1").setDescription("Option 1").setRequired(true))
    .addStringOption(o => o.setName("option2").setDescription("Option 2").setRequired(true))
    .addStringOption(o => o.setName("option3").setDescription("Option 3 (optional)").setRequired(false))
    .addStringOption(o => o.setName("option4").setDescription("Option 4 (optional)").setRequired(false))
    .addStringOption(o => o.setName("option5").setDescription("Option 5 (optional)").setRequired(false))
    .addIntegerOption(o => o.setName("duration").setDescription("Duration in minutes before the poll closes (optional)").setMinValue(1).setMaxValue(10080).setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const question = interaction.options.getString("question", true);
    const options: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const opt = interaction.options.getString(`option${i}`);
      if (opt) options.push(opt);
    }
    const duration = interaction.options.getInteger("duration");

    const description = options.map((o, i) => `${EMOJIS[i]} ${o}`).join("\n\n");
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📊 ${question}`)
      .setDescription(description)
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    if (duration) {
      const closeTime = Math.floor(Date.now() / 1000) + duration * 60;
      embed.setFooter({ text: `Poll closes` }).addFields({ name: "Closes", value: `<t:${closeTime}:R>`, inline: true });
    }

    await interaction.reply({ embeds: [embed] });
    const msg = await interaction.fetchReply();

    for (let i = 0; i < options.length; i++) {
      await msg.react(EMOJIS[i]).catch(() => {});
    }

    if (duration && "send" in msg.channel && "messages" in msg.channel) {
      const textChannel = msg.channel as import("discord.js").TextChannel;
      setTimeout(async () => {
        try {
          const fetched = await textChannel.messages.fetch(msg.id);
          const results = options.map((o, i) => {
            const count = (fetched.reactions.cache.get(EMOJIS[i])?.count ?? 1) - 1;
            return `${EMOJIS[i]} **${o}**: ${count} vote${count !== 1 ? "s" : ""}`;
          }).join("\n");

          const resultEmbed = new EmbedBuilder()
            .setColor(0x00cc66)
            .setTitle(`📊 Poll Results: ${question}`)
            .setDescription(results)
            .setTimestamp();

          await textChannel.send({ embeds: [resultEmbed] });
        } catch { /* poll may have been deleted */ }
      }, duration * 60 * 1000);
    }
  },
};

export default command;
