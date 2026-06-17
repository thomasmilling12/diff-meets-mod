import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, SlashCommandStringOption } from "discord.js";
import type { Command } from "../../client";

type Category = "city" | "offroad" | "industrial" | "beach" | "dealership";

interface Location {
  name: string;
  area: string;
}

const LOCATIONS: Record<Category, Location[]> = {
  city: [
    { name: "Legion Square", area: "Downtown Los Santos" },
    { name: "Maze Bank Arena Lot", area: "La Puerta" },
    { name: "Vinewood Bowl Parking", area: "Vinewood Hills" },
    { name: "Pillbox Hill Underground Garage", area: "Downtown" },
    { name: "Del Perro Plaza", area: "Del Perro" },
    { name: "Mile High Club Construction", area: "Pillbox Hill" },
    { name: "Rockford Plaza", area: "Rockford Hills" },
    { name: "Little Seoul Rooftop Lot", area: "Little Seoul" },
    { name: "Vespucci Boulevard", area: "Vespucci" },
    { name: "Eclipse Towers Lot", area: "West Vinewood" },
  ],
  offroad: [
    { name: "Mount Chiliad Summit", area: "Chiliad Mountain" },
    { name: "Sandy Shores Airfield", area: "Sandy Shores" },
    { name: "Marlowe Vineyards Trails", area: "Tongva Hills" },
    { name: "Grapeseed Fields", area: "Grapeseed" },
    { name: "Raton Canyon Riverbed", area: "Raton Canyon" },
    { name: "Great Chaparral Hills", area: "Great Chaparral" },
    { name: "Lago Zancudo Dirt Roads", area: "Zancudo River" },
    { name: "Paleto Forest Logging Roads", area: "Paleto Forest" },
    { name: "Calafia Train Bridge", area: "Tataviam Mountains" },
    { name: "Galileo Observatory Road", area: "Vinewood Hills" },
  ],
  industrial: [
    { name: "Cypress Flats Warehouses", area: "Cypress Flats" },
    { name: "El Burro Heights Refinery", area: "El Burro Heights" },
    { name: "Murrieta Heights Docks", area: "Murrieta Heights" },
    { name: "LSIA Cargo Apron", area: "LS International Airport" },
    { name: "Elysian Island Docks", area: "Elysian Island" },
    { name: "Terminal Container Yard", area: "Terminal" },
    { name: "Davis Quartz Quarry", area: "Davis Quartz" },
    { name: "Palmer-Taylor Power Station", area: "Palmer-Taylor" },
    { name: "Banning Scrapyard", area: "Banning" },
    { name: "Port of South LS", area: "South Los Santos" },
  ],
  beach: [
    { name: "Vespucci Beach Boardwalk", area: "Vespucci Beach" },
    { name: "Del Perro Pier", area: "Del Perro" },
    { name: "Chumash Pier Lot", area: "Chumash" },
    { name: "Paleto Cove", area: "Paleto Bay" },
    { name: "Procopio Beach", area: "Procopio Promenade" },
    { name: "Pacific Bluffs Overlook", area: "Pacific Bluffs" },
    { name: "Marina Boat Ramp", area: "Vespucci Canals" },
    { name: "North Chumash Coast Road", area: "North Chumash" },
    { name: "Tongva Beachfront", area: "Tongva Valley" },
    { name: "Catfish View Pier", area: "Paleto Bay" },
  ],
  dealership: [
    { name: "Premium Deluxe Motorsport", area: "Burton" },
    { name: "Luxury Autos Showroom", area: "Rockford Hills" },
    { name: "Simeon's Forecourt", area: "Greater Los Santos" },
    { name: "Auto Exotic Repair", area: "La Mesa" },
    { name: "Los Santos Customs (Burton)", area: "Burton" },
    { name: "Beeker's Garage", area: "Burton" },
    { name: "Benny's Original Motor Works", area: "Strawberry" },
    { name: "Vinewood Car Club Lot", area: "West Vinewood" },
    { name: "Arena War Garage", area: "Maze Bank Arena" },
    { name: "Hao's Special Works", area: "LS Car Meet" },
  ],
};

const CATEGORY_LABELS: Record<Category, string> = {
  city: "🏙️ City",
  offroad: "🏔️ Off-Road",
  industrial: "🏭 Industrial",
  beach: "🏖️ Beach",
  dealership: "🏁 Dealership",
};

const recentByKey = new Map<string, string[]>();
const RECENT_MEMORY = 5;

function pickLocation(guildId: string, category: Category): Location {
  const pool = LOCATIONS[category];
  const key = `${guildId}:${category}`;
  const recent = recentByKey.get(key) ?? [];

  const available = pool.filter(l => !recent.includes(l.name));
  const choices = available.length > 0 ? available : pool;
  const picked = choices[Math.floor(Math.random() * choices.length)];

  const updated = [picked.name, ...recent].slice(0, Math.min(RECENT_MEMORY, pool.length - 1));
  recentByKey.set(key, updated);
  return picked;
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("location")
    .setDescription("Generate a random GTA meet location")
    .addStringOption((o: SlashCommandStringOption) =>
      o.setName("type")
        .setDescription("Filter by location type (default: any)")
        .setRequired(false)
        .addChoices(
          { name: "City", value: "city" },
          { name: "Off-Road", value: "offroad" },
          { name: "Industrial", value: "industrial" },
          { name: "Beach", value: "beach" },
          { name: "Dealership", value: "dealership" },
        )),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId ?? "global";
    const chosen = interaction.options.getString("type") as Category | null;
    const category: Category = chosen ?? (Object.keys(LOCATIONS) as Category[])[Math.floor(Math.random() * 5)];

    const loc = pickLocation(guildId, category);

    const embed = new EmbedBuilder()
      .setColor(0x00b3b3)
      .setTitle(`📍 ${loc.name}`)
      .setDescription(`**Area:** ${loc.area}\n**Type:** ${CATEGORY_LABELS[category]}`)
      .setFooter({ text: "Meet Location Generator" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
