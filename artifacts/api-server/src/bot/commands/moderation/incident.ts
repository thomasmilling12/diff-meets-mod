import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandUserOption,
  SlashCommandStringOption,
  SlashCommandIntegerOption,
} from "discord.js";
import type { Command } from "../../client";
import {
  addIncident,
  getIncidentsForUser,
  getRecentIncidents,
  getIncidentsByType,
  removeIncidentById,
  getTopOffenders,
  type Incident,
} from "../../db/incidents";

const TYPE_CHOICES = [
  { name: "Crashing", value: "Crashing" },
  { name: "Overtaking", value: "Overtaking" },
  { name: "Griefing", value: "Griefing" },
  { name: "Rule Violation", value: "Rule Violation" },
];

const TYPE_EMOJI: Record<string, string> = {
  "Crashing": "💥",
  "Overtaking": "🏎️",
  "Griefing": "😈",
  "Rule Violation": "🚫",
};

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function formatIncident(i: Incident): string {
  const emoji = TYPE_EMOJI[i.type] ?? "📝";
  return `**#${i.id}** ${emoji} **${i.type}** — ${truncate(i.details, 200)}\n  By ${i.staff_tag} <t:${i.created_at}:R>`;
}

function joinWithinLimit(lines: string[], limit = 3800): { text: string; shown: number } {
  const out: string[] = [];
  let len = 0;
  for (const line of lines) {
    if (len + line.length + 2 > limit) break;
    out.push(line);
    len += line.length + 2;
  }
  return { text: out.join("\n\n"), shown: out.length };
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("incident")
    .setDescription("Log and review meet incident reports")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((s: SlashCommandSubcommandBuilder) => s.setName("log").setDescription("Log an incident against a user")
      .addUserOption((o: SlashCommandUserOption) => o.setName("user").setDescription("The offender").setRequired(true))
      .addStringOption((o: SlashCommandStringOption) => o.setName("type").setDescription("Incident type").setRequired(true).addChoices(...TYPE_CHOICES))
      .addStringOption((o: SlashCommandStringOption) => o.setName("details").setDescription("What happened").setRequired(true).setMaxLength(500)))
    .addSubcommand((s: SlashCommandSubcommandBuilder) => s.setName("history").setDescription("View a user's incident history")
      .addUserOption((o: SlashCommandUserOption) => o.setName("user").setDescription("The user").setRequired(true)))
    .addSubcommand((s: SlashCommandSubcommandBuilder) => s.setName("recent").setDescription("View recent incidents in the server")
      .addStringOption((o: SlashCommandStringOption) => o.setName("type").setDescription("Filter by type").setRequired(false).addChoices(...TYPE_CHOICES)))
    .addSubcommand((s: SlashCommandSubcommandBuilder) => s.setName("offenders").setDescription("View users with the most incidents"))
    .addSubcommand((s: SlashCommandSubcommandBuilder) => s.setName("remove").setDescription("Remove an incident by ID")
      .addIntegerOption((o: SlashCommandIntegerOption) => o.setName("id").setDescription("Incident ID").setRequired(true))),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "log") {
      const target = interaction.options.getUser("user", true);
      const type = interaction.options.getString("type", true);
      const details = interaction.options.getString("details", true);
      const id = addIncident(guildId, target.id, target.tag, type, details, interaction.user.id, interaction.user.tag);

      const priorCount = getIncidentsForUser(guildId, target.id).length;
      const emoji = TYPE_EMOJI[type] ?? "📝";
      const embed = new EmbedBuilder()
        .setColor(0xff4444)
        .setTitle(`${emoji} Incident Logged — #${id}`)
        .addFields(
          { name: "User", value: `${target.tag} (<@${target.id}>)`, inline: true },
          { name: "Type", value: type, inline: true },
          { name: "Total Incidents", value: `${priorCount}`, inline: true },
          { name: "Details", value: details },
          { name: "Logged By", value: interaction.user.tag },
        )
        .setTimestamp();
      if (priorCount >= 3) {
        embed.setFooter({ text: `⚠️ Repeat offender — ${priorCount} incidents on record` });
      }
      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (sub === "history") {
      const target = interaction.options.getUser("user", true);
      const incidents = getIncidentsForUser(guildId, target.id);
      if (incidents.length === 0) {
        await interaction.reply({ content: `No incidents on record for **${target.tag}**.`, ephemeral: true });
        return;
      }
      const counts = incidents.reduce<Record<string, number>>((acc, i) => {
        acc[i.type] = (acc[i.type] ?? 0) + 1;
        return acc;
      }, {});
      const summary = truncate(Object.entries(counts).map(([t, c]) => `${TYPE_EMOJI[t] ?? "📝"} ${t}: ${c}`).join("  •  "), 1024);
      const { text, shown } = joinWithinLimit(incidents.slice(0, 15).map(formatIncident));
      const hidden = incidents.length - shown;
      const embed = new EmbedBuilder()
        .setColor(incidents.length >= 3 ? 0xff4444 : 0xffa500)
        .setTitle(`Incident History — ${target.tag}`)
        .setDescription(text)
        .addFields({ name: "Summary", value: summary })
        .setFooter({ text: `${incidents.length} total incident(s)${hidden > 0 ? ` — ${hidden} more not shown` : ""}` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (sub === "recent") {
      const type = interaction.options.getString("type");
      const incidents = type ? getIncidentsByType(guildId, type, 15) : getRecentIncidents(guildId, 15);
      if (incidents.length === 0) {
        await interaction.reply({ content: type ? `No **${type}** incidents on record.` : "No incidents on record yet.", ephemeral: true });
        return;
      }
      const { text, shown } = joinWithinLimit(incidents.map(i => `${formatIncident(i)}\n  Against: ${i.user_tag}`));
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(type ? `Recent Incidents — ${type}` : "Recent Incidents")
        .setDescription(text)
        .setFooter({ text: `Showing ${shown} most recent` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (sub === "offenders") {
      const offenders = getTopOffenders(guildId, 10);
      if (offenders.length === 0) {
        await interaction.reply({ content: "No incidents on record yet.", ephemeral: true });
        return;
      }
      const medals = ["🥇", "🥈", "🥉"];
      const embed = new EmbedBuilder()
        .setColor(0xff4444)
        .setTitle("🚓 Repeat Offenders")
        .setDescription(offenders.map((o, i) => `${medals[i] ?? `**${i + 1}.**`} **${o.user_tag}** — ${o.count} incident${o.count !== 1 ? "s" : ""}`).join("\n"))
        .setFooter({ text: "Use /incident history <user> for details" })
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else {
      const id = interaction.options.getInteger("id", true);
      const removed = removeIncidentById(guildId, id);
      await interaction.reply({ content: removed ? `Incident #${id} removed.` : `Incident #${id} not found.`, ephemeral: true });
    }
  },
};

export default command;
