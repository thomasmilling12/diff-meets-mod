import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("nickname")
    .setDescription("Set or reset a member's nickname")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .addSubcommand(s => s.setName("set").setDescription("Set a nickname for a member")
      .addUserOption(o => o.setName("user").setDescription("Member").setRequired(true))
      .addStringOption(o => o.setName("nick").setDescription("New nickname (max 32 chars)").setRequired(true).setMaxLength(32)))
    .addSubcommand(s => s.setName("reset").setDescription("Remove a member's nickname (restores username)")
      .addUserOption(o => o.setName("user").setDescription("Member").setRequired(true)))
    .addSubcommand(s => s.setName("me").setDescription("Change your own nickname")
      .addStringOption(o => o.setName("nick").setDescription("Your new nickname, or leave blank to reset").setRequired(false).setMaxLength(32))),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "me") {
      const nick = interaction.options.getString("nick") ?? null;
      const member = interaction.guild?.members.cache.get(interaction.user.id);
      if (!member) { await interaction.reply({ content: "Could not find your member.", ephemeral: true }); return; }
      try {
        await member.setNickname(nick, `Self-nickname change`);
        await interaction.reply({ content: nick ? `Your nickname has been set to **${nick}**.` : "Your nickname has been reset.", ephemeral: true });
      } catch {
        await interaction.reply({ content: "I couldn't change your nickname — you may have higher permissions than me.", ephemeral: true });
      }
      return;
    }

    const target = interaction.options.getUser("user", true);
    const member = interaction.guild?.members.cache.get(target.id) ?? await interaction.guild?.members.fetch(target.id).catch(() => null);
    if (!member) { await interaction.reply({ content: "Member not found.", ephemeral: true }); return; }
    if (!member.manageable) { await interaction.reply({ content: "I cannot manage this member's nickname.", ephemeral: true }); return; }

    if (sub === "set") {
      const nick = interaction.options.getString("nick", true);
      const old = member.nickname ?? member.user.username;
      await member.setNickname(nick, `Nickname set by ${interaction.user.tag}`);
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle("Nickname Changed")
          .addFields(
            { name: "User", value: `${target.tag}`, inline: true },
            { name: "Before", value: old, inline: true },
            { name: "After", value: nick, inline: true },
          ).setTimestamp()],
      });
    } else {
      const old = member.nickname ?? member.user.username;
      await member.setNickname(null, `Nickname reset by ${interaction.user.tag}`);
      await interaction.reply({ content: `Nickname for **${target.tag}** reset (was: **${old}**).` });
    }
  },
};

export default command;
