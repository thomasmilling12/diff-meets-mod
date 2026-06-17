import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, SlashCommandIntegerOption } from "discord.js";
import type { Command } from "../../client";

interface MeetTheme {
  name: string;
  description: string;
}

const THEMES: MeetTheme[] = [
  { name: "Forgotten Treasure", description: "Rare, overlooked, or underrated cars that deserve more love." },
  { name: "Cars Under $50k", description: "Show what you can build or buy on a tighter budget." },
  { name: "Japanese Classics", description: "JDM legends — Skylines, Supras, RX-7s, NSXs and more." },
  { name: "Dealership Spec", description: "Bone-stock, factory-fresh, exactly as it left the showroom." },
  { name: "Cars That Changed The Scene", description: "Icons that defined an era or shifted car culture." },
  { name: "Euro Night", description: "German and European builds — BMW, Audi, Mercedes, Porsche." },
  { name: "Muscle & Metal", description: "American muscle, classic and modern, big power and attitude." },
  { name: "Stance Wars", description: "Lowest, cleanest fitment wins — bags, coilovers, camber." },
  { name: "Sleeper Builds", description: "Looks slow, goes fast. Hidden power under a quiet shell." },
  { name: "Track Weapons", description: "Cars built to be driven hard — cages, aero, slicks." },
  { name: "Time Attack", description: "Aggressive aero, big wings, lap-time machines." },
  { name: "Off-Road & Overland", description: "Lifted trucks, 4x4s, and adventure-ready rigs." },
  { name: "Drift Missiles", description: "Sideways specialists — angle kits, hydros, and tire smoke." },
  { name: "Supercar Sunday", description: "Exotics only — the heavy hitters come out to play." },
  { name: "Retro Restomod", description: "Classic looks, modern power and tech underneath." },
  { name: "First Car Throwback", description: "Bring whatever your first ride was — or a tribute to it." },
  { name: "Color Coordinated", description: "One color rules the lot. Pick a shade and roll deep." },
  { name: "Widebody Wonders", description: "Fender flares, big arches, and aggressive stances." },
  { name: "Daily Drivers", description: "The cars you actually live with — clean and reliable builds." },
  { name: "Future Classics", description: "Modern cars that'll be legends in 20 years." },
  { name: "Hot Hatch Heaven", description: "Small, light, and quick — GTIs, Type Rs, RSs and more." },
  { name: "Big Power Builds", description: "Turbos, superchargers, and dyno bragging rights." },
  { name: "Clean & Simple", description: "No mods needed — just spotless, well-kept cars." },
  { name: "Underground Imports", description: "The rare imports you don't see every day." },
];

function pickUnique(count: number): MeetTheme[] {
  const pool = [...THEMES];
  const picked: MeetTheme[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("theme")
    .setDescription("Get a random car meet theme suggestion")
    .addIntegerOption((o: SlashCommandIntegerOption) =>
      o.setName("count")
        .setDescription("How many themes to suggest (1-5, default: 1)")
        .setMinValue(1)
        .setMaxValue(5)
        .setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const count = interaction.options.getInteger("count") ?? 1;
    const themes = pickUnique(count);

    const embed = new EmbedBuilder()
      .setColor(0xff6b35)
      .setTimestamp()
      .setFooter({ text: "Meet Theme Generator" });

    if (count === 1) {
      const t = themes[0];
      embed.setTitle(`🏁 ${t.name}`).setDescription(t.description);
    } else {
      embed.setTitle("🏁 Meet Theme Ideas")
        .setDescription(themes.map(t => `**${t.name}**\n${t.description}`).join("\n\n"));
    }

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
