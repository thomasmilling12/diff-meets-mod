import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  SlashCommandStringOption,
  MessageComponentInteraction,
} from "discord.js";
import type { Command } from "../../client";

type Category = "cars" | "locations" | "updates" | "racing";

interface TriviaQuestion {
  category: Category;
  question: string;
  options: string[];
  answer: number;
}

const QUESTIONS: TriviaQuestion[] = [
  // Cars
  { category: "cars", question: "Which in-game manufacturer is GTA's parody of Ferrari?", options: ["Grotti", "Pegassi", "Truffade", "Ocelot"], answer: 0 },
  { category: "cars", question: "The Pegassi Zentorno is based on which real-world supercar?", options: ["McLaren P1", "Lamborghini Sesto Elemento", "Bugatti Veyron", "Koenigsegg One:1"], answer: 1 },
  { category: "cars", question: "Which brand in GTA parodies BMW?", options: ["Übermacht", "Benefactor", "Enus", "Lampadati"], answer: 0 },
  { category: "cars", question: "The Truffade Adder is modeled after which hypercar?", options: ["Pagani Huayra", "Bugatti Veyron", "Hennessey Venom", "SSC Tuatara"], answer: 1 },
  { category: "cars", question: "Which car is widely considered GTA Online's drag-racing king?", options: ["Banshee", "Vigilante", "Krieger", "Emerus"], answer: 2 },
  { category: "cars", question: "The Ocelot brand is GTA's parody of which British marque?", options: ["Aston Martin / Jaguar", "Bentley", "Rolls-Royce", "Lotus"], answer: 0 },
  { category: "cars", question: "Which manufacturer parodies Mercedes-Benz in GTA?", options: ["Übermacht", "Benefactor", "Vapid", "Bravado"], answer: 1 },
  { category: "cars", question: "The Vapid brand is GTA's stand-in for which American maker?", options: ["Chevrolet", "Dodge", "Ford", "Cadillac"], answer: 2 },

  // Locations
  { category: "locations", question: "What is the name of the city in GTA V?", options: ["Liberty City", "Vice City", "Los Santos", "San Fierro"], answer: 2 },
  { category: "locations", question: "Which mountain towers over the north of the GTA V map?", options: ["Mount Gordo", "Mount Chiliad", "Mount Josiah", "Vinewood Hills"], answer: 1 },
  { category: "locations", question: "Vinewood is a parody of which real-world location?", options: ["Beverly Hills", "Hollywood", "Times Square", "Venice Beach"], answer: 1 },
  { category: "locations", question: "What is the name of the desert region in GTA V?", options: ["Grand Senora Desert", "Bone County", "Sandy Shores Flats", "Raton Canyon"], answer: 0 },
  { category: "locations", question: "Which small town sits by the Alamo Sea?", options: ["Paleto Bay", "Grapeseed", "Sandy Shores", "Harmony"], answer: 2 },
  { category: "locations", question: "Which northern town hosts the big bank heist setting?", options: ["Paleto Bay", "Chumash", "Vespucci", "Davis"], answer: 0 },
  { category: "locations", question: "The state of San Andreas in GTA V is based on which US state?", options: ["Nevada", "Florida", "California", "Arizona"], answer: 2 },

  // Updates
  { category: "updates", question: "Which DLC introduced the Nightclub business?", options: ["After Hours", "The Doomsday Heist", "Arena War", "The Diamond Casino Heist"], answer: 0 },
  { category: "updates", question: "Which update added the Diamond Casino & Resort?", options: ["The Diamond Casino Heist", "The Diamond Casino & Resort", "Los Santos Summer Special", "After Hours"], answer: 1 },
  { category: "updates", question: "The Cayo Perico Heist takes place on an island owned by whom?", options: ["Madrazo", "El Rubio", "Avon Hertz", "Vincent"], answer: 1 },
  { category: "updates", question: "Which update brought car meets and the LS Car Meet?", options: ["Los Santos Tuners", "Import/Export", "Arena War", "The Contract"], answer: 0 },
  { category: "updates", question: "Which 2021 update featured Franklin and Dr. Dre?", options: ["The Contract", "Los Santos Tuners", "The Cayo Perico Heist", "Los Santos Drug Wars"], answer: 0 },
  { category: "updates", question: "Which update introduced the Acid Lab business?", options: ["Los Santos Drug Wars", "The Criminal Enterprises", "San Andreas Mercenaries", "The Contract"], answer: 0 },
  { category: "updates", question: "The original Heists update for GTA Online launched in which year?", options: ["2013", "2014", "2015", "2016"], answer: 2 },

  // Racing
  { category: "racing", question: "Which race type lets you use weapons against opponents?", options: ["Street Race", "GTA Race", "Time Trial", "Pursuit Race"], answer: 1 },
  { category: "racing", question: "What does a 'Time Trial' reward you for?", options: ["Most drifts", "Beating a target time solo", "Wrecking rivals", "Longest jump"], answer: 1 },
  { category: "racing", question: "Which class do supercars like the Krieger belong to?", options: ["Sports", "Super", "Muscle", "Sports Classics"], answer: 1 },
  { category: "racing", question: "Transform Races are known for featuring what?", options: ["Only motorcycles", "Vehicle swaps mid-race", "Underwater sections only", "No checkpoints"], answer: 1 },
  { category: "racing", question: "Which feature lets racers vote on the next track?", options: ["Quick Restart", "Next Job voting", "Auto-rotation", "Pole Position"], answer: 1 },
  { category: "racing", question: "In races, what does drafting behind another car do?", options: ["Slows you down", "Gives a speed boost", "Refills health", "Disables your brakes"], answer: 1 },
];

const LETTERS = ["A", "B", "C", "D"];
const CATEGORY_LABELS: Record<Category, string> = {
  cars: "🚗 Cars",
  locations: "📍 Locations",
  updates: "🆕 Updates",
  racing: "🏁 Racing",
};

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("trivia")
    .setDescription("Answer a GTA trivia question")
    .addStringOption((o: SlashCommandStringOption) =>
      o.setName("category")
        .setDescription("Pick a category (default: random)")
        .setRequired(false)
        .addChoices(
          { name: "Cars", value: "cars" },
          { name: "Locations", value: "locations" },
          { name: "Updates", value: "updates" },
          { name: "Racing", value: "racing" },
        )),

  async execute(interaction: ChatInputCommandInteraction) {
    const category = interaction.options.getString("category") as Category | null;
    const pool = category ? QUESTIONS.filter(q => q.category === category) : QUESTIONS;
    const q = pool[Math.floor(Math.random() * pool.length)];

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`${CATEGORY_LABELS[q.category]} — GTA Trivia`)
      .setDescription(`**${q.question}**\n\n${q.options.map((o, i) => `**${LETTERS[i]}.** ${o}`).join("\n")}`)
      .setFooter({ text: "You have 20 seconds to answer" })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      ...q.options.map((_, i) =>
        new ButtonBuilder()
          .setCustomId(`trivia_${i}`)
          .setLabel(LETTERS[i])
          .setStyle(ButtonStyle.Secondary)),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
    const msg = await interaction.fetchReply();

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 20_000,
    });

    let answered = false;

    collector.on("collect", async (choice: MessageComponentInteraction) => {
      if (choice.user.id !== interaction.user.id) {
        await choice.reply({
          content: "Only the person who started this trivia can answer. Run `/trivia` to play your own!",
          ephemeral: true,
        }).catch(() => {});
        return;
      }

      answered = true;
      collector.stop("answered");

      const picked = parseInt(choice.customId.split("_")[1], 10);
      const correct = picked === q.answer;

      const resultRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        ...q.options.map((_, i) =>
          new ButtonBuilder()
            .setCustomId(`trivia_done_${i}`)
            .setLabel(LETTERS[i])
            .setStyle(i === q.answer ? ButtonStyle.Success : i === picked ? ButtonStyle.Danger : ButtonStyle.Secondary)
            .setDisabled(true)),
      );

      const resultEmbed = new EmbedBuilder()
        .setColor(correct ? 0x00cc66 : 0xff4444)
        .setTitle(correct ? "✅ Correct!" : "❌ Wrong!")
        .setDescription(`**${q.question}**\n\nThe answer was **${LETTERS[q.answer]}. ${q.options[q.answer]}**`)
        .setFooter({ text: `Answered by ${interaction.user.tag}` })
        .setTimestamp();

      await choice.update({ embeds: [resultEmbed], components: [resultRow] }).catch(() => {});
    });

    collector.on("end", async () => {
      if (answered) return;
      const timeoutRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        ...q.options.map((_, i) =>
          new ButtonBuilder()
            .setCustomId(`trivia_to_${i}`)
            .setLabel(LETTERS[i])
            .setStyle(i === q.answer ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setDisabled(true)),
      );
      const timeoutEmbed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle("⏰ Time's up!")
        .setDescription(`**${q.question}**\n\nThe answer was **${LETTERS[q.answer]}. ${q.options[q.answer]}**`)
        .setTimestamp();
      await interaction.editReply({ embeds: [timeoutEmbed], components: [timeoutRow] }).catch(() => {});
    });
  },
};

export default command;
