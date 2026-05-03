import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, ChannelType } from "discord.js";
import type { Command } from "../../client";
import { getInviteTracking, setInviteTracking, getTopInviters } from "../../db/inviteTracking";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("invites")
    .setDescription("Invite tracking")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("enable").setDescription("Enable invite tracking")
      .addChannelOption(o => o.setName("log_channel").setDescription("Channel to log invite joins").addChannelTypes(ChannelType.GuildText).setRequired(false)))
    .addSubcommand(s => s.setName("disable").setDescription("Disable invite tracking"))
    .addSubcommand(s => s.setName("leaderboard").setDescription("Show top inviters"))
    .addSubcommand(s => s.setName("check").setDescription("Check who invited a user")
      .addUserOption(o => o.setName("user").setDescription("User to check").setRequired(true))),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "enable") {
      const logChannel = interaction.options.getChannel("log_channel");
      setInviteTracking(guildId, { enabled: 1, log_channel_id: logChannel?.id ?? null });
      await interaction.reply({ content: `Invite tracking enabled.${logChannel ? ` Join source logged to <#${logChannel.id}>` : ""}` });
    } else if (sub === "disable") {
      setInviteTracking(guildId, { enabled: 0 });
      await interaction.reply({ content: "Invite tracking disabled." });
    } else if (sub === "leaderboard") {
      const top = getTopInviters(guildId);
      if (top.length === 0) {
        await interaction.reply({ content: "No invite data yet.", ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Top Inviters")
        .setDescription(top.map((inv, i) => `**${i + 1}.** ${inv.inviter_tag} — **${inv.uses}** invite(s)\n  Code: \`${inv.invite_code}\``).join("\n\n"))
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } else {
      const { getMemberInvite } = await import("../../db/inviteTracking");
      const target = interaction.options.getUser("user", true);
      const inv = getMemberInvite(guildId, target.id);
      if (!inv || !inv.invited_by_id) {
        await interaction.reply({ content: `No invite data found for **${target.tag}**.`, ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Invite Info")
        .addFields(
          { name: "User", value: `${target.tag}`, inline: true },
          { name: "Invited By", value: `<@${inv.invited_by_id}>`, inline: true },
          { name: "Invite Code", value: inv.invite_code ? `\`${inv.invite_code}\`` : "Unknown", inline: true },
        ).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
