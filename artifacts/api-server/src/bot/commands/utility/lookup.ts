import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, UserFlags } from "discord.js";
import type { Command } from "../../client";

const FLAG_LABELS: Partial<Record<string, string>> = {
  Staff: "🛡️ Discord Staff",
  Partner: "🤝 Partnered Server Owner",
  Hypesquad: "HypeSquad Events",
  BugHunterLevel1: "🐛 Bug Hunter Level 1",
  BugHunterLevel2: "🐛 Bug Hunter Level 2",
  HypeSquadOnlineHouse1: "🏠 House Bravery",
  HypeSquadOnlineHouse2: "🏠 House Brilliance",
  HypeSquadOnlineHouse3: "🏠 House Balance",
  PremiumEarlySupporter: "⭐ Early Supporter",
  VerifiedDeveloper: "✅ Verified Bot Developer",
  CertifiedModerator: "🛡️ Discord Certified Moderator",
  ActiveDeveloper: "🔧 Active Developer",
};

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("lookup")
    .setDescription("Look up any Discord user by ID — works even if they're not in this server")
    .addStringOption(o => o.setName("user_id").setDescription("Discord user ID").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const id = interaction.options.getString("user_id", true).trim();
    if (!/^\d{17,19}$/.test(id)) {
      await interaction.reply({ content: "Invalid ID. Discord user IDs are 17–19 digit numbers.", ephemeral: true });
      return;
    }

    await interaction.deferReply();

    const user = await interaction.client.users.fetch(id, { force: true }).catch(() => null);
    if (!user) {
      await interaction.editReply({ content: `No user found with ID \`${id}\`. They may have deleted their account.` });
      return;
    }

    const member = interaction.guild?.members.cache.get(id) ?? null;
    const createdTs = Math.floor(user.createdTimestamp / 1000);
    const ageMs = Date.now() - user.createdTimestamp;
    const ageDays = Math.floor(ageMs / 86400000);

    const flags = user.flags?.toArray() ?? [];
    const badgeList = flags.map(f => FLAG_LABELS[f] ?? f).filter(Boolean);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`User Lookup — ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 512 }))
      .addFields(
        { name: "ID", value: user.id, inline: true },
        { name: "Bot", value: user.bot ? "Yes" : "No", inline: true },
        { name: "System", value: user.system ? "Yes" : "No", inline: true },
        { name: "Created", value: `<t:${createdTs}:F> (<t:${createdTs}:R>)` },
        { name: "Account Age", value: `${ageDays} days`, inline: true },
        ...(member ? [
          { name: "In Server", value: "Yes", inline: true },
          { name: "Joined", value: `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>`, inline: true },
          { name: "Nickname", value: member.nickname ?? "None", inline: true },
          { name: "Highest Role", value: `${member.roles.highest.name}`, inline: true },
        ] : [{ name: "In Server", value: "No", inline: true }]),
        ...(badgeList.length > 0 ? [{ name: "Badges", value: badgeList.join("\n") }] : []),
      )
      .setTimestamp();

    if (user.banner) embed.setImage(user.bannerURL({ size: 1024 }) ?? null);

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
