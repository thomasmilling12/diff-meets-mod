import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { createCase } from "../../db/cases";
import { sendModLog } from "../../utils/modLog";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("massban")
    .setDescription("Ban multiple users by pasting a list of user IDs")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(o => o.setName("user_ids").setDescription("Space or newline-separated user IDs").setRequired(true).setMaxLength(2000))
    .addStringOption(o => o.setName("reason").setDescription("Reason applied to all bans").setRequired(false))
    .addIntegerOption(o => o.setName("delete_days").setDescription("Days of messages to delete (0-7, default: 0)").setMinValue(0).setMaxValue(7).setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const rawIds = interaction.options.getString("user_ids", true);
    const reason = interaction.options.getString("reason") ?? "Mass ban";
    const deleteDays = interaction.options.getInteger("delete_days") ?? 0;
    const guildId = interaction.guildId!;

    const ids = [...new Set(rawIds.split(/[\s,]+/).filter(id => /^\d{17,19}$/.test(id)))];
    if (ids.length === 0) {
      await interaction.reply({ content: "No valid user IDs found. IDs must be 17–19 digit numbers.", ephemeral: true });
      return;
    }
    if (ids.length > 100) {
      await interaction.reply({ content: "Maximum 100 IDs per massban.", ephemeral: true });
      return;
    }

    await interaction.deferReply();

    let banned = 0;
    let failed = 0;
    const bannedTags: string[] = [];

    for (const id of ids) {
      try {
        const user = await interaction.client.users.fetch(id).catch(() => null);
        if (!user) { failed++; continue; }

        const member = interaction.guild?.members.cache.get(id);
        if (member && !member.bannable) { failed++; continue; }

        await interaction.guild?.members.ban(user, {
          reason: `[Massban] ${reason} | By ${interaction.user.tag}`,
          deleteMessageSeconds: deleteDays * 86400,
        });

        createCase({
          guildId, action: "BAN", userId: user.id, userTag: user.tag,
          moderatorId: interaction.user.id, moderatorTag: interaction.user.tag,
          reason: `[Massban] ${reason}`,
        });

        bannedTags.push(user.tag);
        banned++;
      } catch {
        failed++;
      }
    }

    const embed = new EmbedBuilder()
      .setColor(banned > 0 ? 0xff4444 : 0x888888)
      .setTitle("🔨 Massban Complete")
      .addFields(
        { name: "✅ Banned", value: `${banned}`, inline: true },
        { name: "❌ Failed / Skipped", value: `${failed}`, inline: true },
        { name: "Reason", value: reason },
        ...(bannedTags.length > 0 ? [{ name: "Users Banned", value: bannedTags.slice(0, 20).join("\n") + (bannedTags.length > 20 ? `\n…+${bannedTags.length - 20} more` : "") }] : []),
      ).setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    if (banned > 0) {
      await sendModLog(interaction.client, guildId, "BAN", interaction.user, interaction.user.tag, `[Massban: ${banned} users] ${reason}`);
    }
  },
};

export default command;
