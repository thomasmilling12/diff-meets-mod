import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import type { Command } from "../../client";
import { getWarnings } from "../../db/warnings";
import { db } from "../../db/database";

interface CaseRow { case_number: number; action: string; reason: string; moderator_tag: string; created_at: number }

const ACTION_EMOJI: Record<string, string> = {
  BAN: "🔨", KICK: "👢", MUTE: "🔇", WARN: "⚠️", TEMPBAN: "⏱️🔨",
  UNBAN: "✅", UNMUTE: "🔊", NOTE: "📝", DELETE: "🗑️",
};

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("userhistory")
    .setDescription("Full moderation history for a user — cases, warnings, notes")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName("user").setDescription("User to look up").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const guildId = interaction.guildId!;

    const warnings = getWarnings(guildId, target.id);
    const cases = db.prepare("SELECT * FROM cases WHERE guild_id = ? AND user_id = ? ORDER BY case_number DESC LIMIT 10")
      .all(guildId, target.id) as unknown as CaseRow[];
    const notes = db.prepare("SELECT * FROM notes WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 5")
      .all(guildId, target.id) as unknown as Array<{ note: string; moderator_tag: string; created_at: number }>;

    const embed = new EmbedBuilder()
      .setColor(warnings.length > 5 ? 0xff4444 : warnings.length > 0 ? 0xffa500 : 0x5865f2)
      .setTitle(`Moderation History — ${target.tag}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: "User ID", value: target.id, inline: true },
        { name: "Account Created", value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "⚠️ Total Warnings", value: `${warnings.length}`, inline: true },
      );

    if (cases.length > 0) {
      embed.addFields({
        name: `📋 Recent Cases (${cases.length} shown)`,
        value: cases.map(c =>
          `**#${c.case_number}** ${ACTION_EMOJI[c.action] ?? ""}${c.action} — ${c.reason.slice(0, 50)}${c.reason.length > 50 ? "…" : ""}\n<t:${c.created_at}:d> by ${c.moderator_tag}`
        ).join("\n"),
      });
    } else {
      embed.addFields({ name: "📋 Cases", value: "None on record", inline: true });
    }

    if (warnings.length > 0) {
      embed.addFields({
        name: `⚠️ Recent Warnings (${Math.min(warnings.length, 5)} of ${warnings.length})`,
        value: warnings.slice(0, 5).map(w =>
          `**#${w.id}** — ${w.reason.slice(0, 60)}${w.reason.length > 60 ? "…" : ""}\n<t:${w.created_at}:d> by ${w.moderator_tag}`
        ).join("\n"),
      });
    }

    if (notes.length > 0) {
      embed.addFields({
        name: `📝 Notes (${notes.length})`,
        value: notes.map(n => `${n.note.slice(0, 60)}${n.note.length > 60 ? "…" : ""} — ${n.moderator_tag}`).join("\n"),
      });
    }

    embed.setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
