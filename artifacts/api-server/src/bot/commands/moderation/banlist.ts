import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";

const PAGE_SIZE = 15;

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("banlist")
    .setDescription("View all banned users in this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addIntegerOption(o => o.setName("page").setDescription("Page number").setMinValue(1).setRequired(false))
    .addStringOption(o => o.setName("search").setDescription("Search by username or user ID").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const page = (interaction.options.getInteger("page") ?? 1) - 1;
    const search = interaction.options.getString("search")?.toLowerCase() ?? "";

    const bans = await interaction.guild?.bans.fetch().catch(() => null);
    if (!bans) { await interaction.editReply({ content: "Failed to fetch ban list." }); return; }

    let banArray = [...bans.values()];
    if (search) {
      banArray = banArray.filter(b => b.user.tag.toLowerCase().includes(search) || b.user.id.includes(search));
    }

    if (banArray.length === 0) {
      await interaction.editReply({ content: search ? `No bans matching \`${search}\`.` : "No users are currently banned." });
      return;
    }

    const pages = Math.ceil(banArray.length / PAGE_SIZE);
    const slice = banArray.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    const embed = new EmbedBuilder()
      .setColor(0xff4444)
      .setTitle(`🔨 Ban List — ${interaction.guild?.name}`)
      .setDescription(slice.map(b =>
        `**${b.user.tag}** (${b.user.id})${b.reason ? `\n  ↳ ${b.reason.slice(0, 60)}` : ""}`
      ).join("\n"))
      .setFooter({ text: `Page ${page + 1}/${pages} • ${banArray.length} ban(s)${search ? ` matching "${search}"` : ""}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
