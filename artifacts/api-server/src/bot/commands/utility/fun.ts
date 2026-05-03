import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";

const EIGHT_BALL_RESPONSES = [
  "It is certain.", "It is decidedly so.", "Without a doubt.", "Yes, definitely.",
  "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.",
  "Yes.", "Signs point to yes.", "Reply hazy, try again.", "Ask again later.",
  "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.",
  "Don't count on it.", "My reply is no.", "My sources say no.",
  "Outlook not so good.", "Very doubtful.",
];

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("fun")
    .setDescription("Fun utility commands")
    .addSubcommand(s => s.setName("8ball").setDescription("Ask the magic 8-ball a question")
      .addStringOption(o => o.setName("question").setDescription("Your question").setRequired(true)))
    .addSubcommand(s => s.setName("coinflip").setDescription("Flip a coin"))
    .addSubcommand(s => s.setName("dice").setDescription("Roll dice")
      .addIntegerOption(o => o.setName("sides").setDescription("Number of sides (default: 6)").setMinValue(2).setMaxValue(100).setRequired(false))
      .addIntegerOption(o => o.setName("count").setDescription("Number of dice (default: 1)").setMinValue(1).setMaxValue(10).setRequired(false)))
    .addSubcommand(s => s.setName("color").setDescription("Generate a random color"))
    .addSubcommand(s => s.setName("choose").setDescription("Choose between options")
      .addStringOption(o => o.setName("options").setDescription("Comma-separated options, e.g. pizza,pasta,burger").setRequired(true))),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "8ball") {
      const question = interaction.options.getString("question", true);
      const answer = EIGHT_BALL_RESPONSES[Math.floor(Math.random() * EIGHT_BALL_RESPONSES.length)];
      const isPositive = EIGHT_BALL_RESPONSES.indexOf(answer) < 10;
      const color = isPositive ? 0x00cc66 : EIGHT_BALL_RESPONSES.indexOf(answer) < 15 ? 0xffa500 : 0xff4444;
      const embed = new EmbedBuilder().setColor(color)
        .setTitle("🎱 Magic 8-Ball")
        .addFields({ name: "Question", value: question }, { name: "Answer", value: answer })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });

    } else if (sub === "coinflip") {
      const result = Math.random() < 0.5 ? "Heads" : "Tails";
      const embed = new EmbedBuilder().setColor(0xffd700)
        .setTitle("🪙 Coin Flip")
        .setDescription(`**${result}!**`)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });

    } else if (sub === "dice") {
      const sides = interaction.options.getInteger("sides") ?? 6;
      const count = interaction.options.getInteger("count") ?? 1;
      const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
      const total = rolls.reduce((a, b) => a + b, 0);
      const embed = new EmbedBuilder().setColor(0x5865f2)
        .setTitle(`🎲 Rolled ${count}d${sides}`)
        .setDescription(rolls.map(r => `**${r}**`).join(" + ") + (count > 1 ? ` = **${total}**` : ""))
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });

    } else if (sub === "color") {
      const hex = Math.floor(Math.random() * 0xffffff);
      const hexStr = `#${hex.toString(16).padStart(6, "0").toUpperCase()}`;
      const r = (hex >> 16) & 0xff;
      const g = (hex >> 8) & 0xff;
      const b = hex & 0xff;
      const embed = new EmbedBuilder().setColor(hex)
        .setTitle("🎨 Random Color")
        .addFields(
          { name: "Hex", value: hexStr, inline: true },
          { name: "RGB", value: `rgb(${r}, ${g}, ${b})`, inline: true },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });

    } else if (sub === "choose") {
      const raw = interaction.options.getString("options", true);
      const options = raw.split(",").map(o => o.trim()).filter(Boolean);
      if (options.length < 2) {
        await interaction.reply({ content: "Please provide at least 2 options separated by commas.", ephemeral: true });
        return;
      }
      const chosen = options[Math.floor(Math.random() * options.length)];
      const embed = new EmbedBuilder().setColor(0x5865f2)
        .setTitle("🤔 I choose...")
        .setDescription(`**${chosen}**`)
        .addFields({ name: "Options", value: options.join(" / ") })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
