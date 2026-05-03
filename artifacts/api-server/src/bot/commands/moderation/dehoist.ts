import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { enableDehoist, disableDehoist, isDehoistEnabled, isHoisted } from "../../db/dehoist";

const REPLACEMENT = "\u200b";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("dehoist")
    .setDescription("Remove hoisting characters from usernames to prevent name manipulation")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .addSubcommand(s => s.setName("user").setDescription("Manually dehoist a specific member")
      .addUserOption(o => o.setName("user").setDescription("Member to dehoist").setRequired(true)))
    .addSubcommand(s => s.setName("all").setDescription("Dehoist all currently hoisted members in the server"))
    .addSubcommand(s => s.setName("enable").setDescription("Auto-dehoist new members and nickname changes"))
    .addSubcommand(s => s.setName("disable").setDescription("Disable auto-dehoist"))
    .addSubcommand(s => s.setName("status").setDescription("Show whether auto-dehoist is enabled")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "enable") {
      enableDehoist(guildId);
      await interaction.reply({ content: "✅ Auto-dehoist enabled. New members and nickname changes will be dehoisted automatically." });

    } else if (sub === "disable") {
      disableDehoist(guildId);
      await interaction.reply({ content: "Auto-dehoist disabled." });

    } else if (sub === "status") {
      const enabled = isDehoistEnabled(guildId);
      await interaction.reply({ content: `Auto-dehoist is currently **${enabled ? "enabled" : "disabled"}**.` });

    } else if (sub === "user") {
      const target = interaction.options.getUser("user", true);
      const member = interaction.guild?.members.cache.get(target.id) ?? await interaction.guild?.members.fetch(target.id).catch(() => null);
      if (!member) { await interaction.reply({ content: "Member not found.", ephemeral: true }); return; }
      if (!member.manageable) { await interaction.reply({ content: "I cannot manage this member.", ephemeral: true }); return; }

      const display = member.nickname ?? member.user.username;
      if (!isHoisted(display)) {
        await interaction.reply({ content: `**${target.tag}**'s name is not hoisted.`, ephemeral: true });
        return;
      }
      await member.setNickname(`${REPLACEMENT}${display}`, `Dehoist by ${interaction.user.tag}`);
      await interaction.reply({ content: `Dehoisted **${target.tag}**. Name was: \`${display}\`` });

    } else {
      await interaction.deferReply();
      const members = await interaction.guild?.members.fetch().catch(() => null);
      if (!members) { await interaction.editReply({ content: "Failed to fetch members." }); return; }

      let count = 0;
      for (const member of members.values()) {
        if (!member.manageable) continue;
        const display = member.nickname ?? member.user.username;
        if (isHoisted(display)) {
          await member.setNickname(`${REPLACEMENT}${display}`, "Mass dehoist").catch(() => {});
          count++;
        }
      }

      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle("Dehoist Complete")
          .addFields({ name: "Members Dehoisted", value: `${count}` }).setTimestamp()],
      });
    }
  },
};

export default command;
