import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all available commands")
    .addStringOption(o => o.setName("category").setDescription("Filter by category").setRequired(false)
      .addChoices(
        { name: "Moderation", value: "mod" },
        { name: "Auto-Mod & Filters", value: "automod" },
        { name: "Logging & Config", value: "config" },
        { name: "Tickets & Verification", value: "tickets" },
        { name: "Role Management", value: "roles" },
        { name: "Utility", value: "utility" },
      )),

  async execute(interaction: ChatInputCommandInteraction) {
    const category = interaction.options.getString("category");

    const sections: Record<string, { name: string; value: string }> = {
      mod: {
        name: "🔨 Moderation",
        value: [
          "`/ban` — Ban a member (DMs them, creates case)",
          "`/unban` — Unban a user by ID",
          "`/tempban` — Temp-ban with auto-unban",
          "`/kick` — Kick a member",
          "`/mute` — Timeout a member",
          "`/unmute` — Remove timeout",
          "`/warn` — Issue a warning (triggers escalation if configured)",
          "`/warnings list/remove/clear` — Manage warnings with IDs + pagination",
          "`/purge` — Bulk delete messages",
          "`/lock` — Lock/unlock a channel",
          "`/slowmode` — Set channel slowmode",
          "`/note` — Add private mod notes",
          "`/case view/list/edit` — View and edit mod cases (paginated)",
        ].join("\n"),
      },
      tickets: {
        name: "🎫 Tickets & Verification",
        value: [
          "`/ticket` — Open a support ticket (creates private channel)",
          "`/close-ticket` — Close and archive a ticket with transcript",
          "`/ticket-setup config` — Set support role, category, log channel",
          "`/ticket-setup panel` — Post a ticket creation panel button",
          "`/ticket-setup status` — View current ticket config",
          "`/verify-setup send` — Post verification button in a channel",
          "`/verify-setup disable` — Disable verification",
          "`/verify-setup status` — View verification config",
        ].join("\n"),
      },
      automod: {
        name: "🤖 Auto-Mod & Filters",
        value: [
          "`/automod setup` — Enable/disable anti-spam, anti-invite, anti-caps, etc.",
          "`/automod status` — View auto-mod config",
          "`/wordfilter add/remove/list` — Manage word filter",
          "`/escalation add/remove/list` — Auto-punish at X warnings (mute/kick/ban)",
          "`/raid setup/enable/disable/unlock/status` — Raid protection & auto-lockdown",
        ].join("\n"),
      },
      config: {
        name: "⚙️ Logging & Config",
        value: [
          "`/logconfig set` — Set log channel by type (mod/messages/members/voice/roles)",
          "`/logconfig disable` — Disable a log type",
          "`/logconfig status` — View all log channels",
          "`/log setchannel` — Quick-set mod log channel",
          "`/log disable` — Disable mod logging",
          "`/welcome set` — Set welcome message",
          "`/autorole set` — Auto-assign role on join",
          "`/buttonroles add/post` — Role toggle buttons",
          "`/customcmd add/remove/list` — Custom text commands",
          "`/stats-channel add/remove/list` — Auto-updating stat voice channels",
        ].join("\n"),
      },
      roles: {
        name: "👑 Role Management",
        value: [
          "`/role add/remove/info` — Assign/remove/inspect roles on members",
          "`/self-role add/remove/list` — Manage self-assignable roles (admin)",
          "`/join-role` — Give yourself a self-assignable role",
          "`/leave-role` — Remove a self-assignable role",
          "`/role-id` — Get role ID and info",
          "`/mass-role` — Add/remove a role from all members",
        ].join("\n"),
      },
      utility: {
        name: "🛠️ Utility",
        value: [
          "`/poll` — Create a reaction poll (up to 5 options, optional duration)",
          "`/announce` — Send a formatted announcement embed",
          "`/ping` — Check bot latency",
          "`/userinfo` — View user details",
          "`/serverinfo` — View server details",
          "`/help` — Show this message",
        ].join("\n"),
      },
    };

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("DIFF Meets Mod — Command Help")
      .setFooter({ text: "DIFF Meets Mod • Use /help category:<name> for a specific section" })
      .setTimestamp();

    if (category && sections[category]) {
      embed.setDescription(`Showing **${sections[category].name}** commands:`);
      embed.addFields(sections[category]);
    } else {
      embed.setDescription("Use `/help category:<name>` to filter. Here's the full list:");
      embed.addFields(Object.values(sections));
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

export default command;
