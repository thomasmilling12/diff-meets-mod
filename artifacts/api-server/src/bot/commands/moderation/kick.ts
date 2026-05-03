import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../client";
import { createCase } from "../../db/cases";
import { sendModLog } from "../../utils/modLog";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName("user").setDescription("The user to kick").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason for the kick").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const guildId = interaction.guildId!;

    const member = interaction.guild?.members.cache.get(target.id);
    if (!member || !member.kickable) {
      await interaction.reply({ content: "I cannot kick this user.", ephemeral: true });
      return;
    }

    try {
      try {
        const { EmbedBuilder } = await import("discord.js");
        await target.send({ embeds: [new EmbedBuilder().setColor(0xff8800).setTitle(`👢 Kicked from ${interaction.guild?.name}`)
          .addFields({ name: "Reason", value: reason }, { name: "Moderator", value: interaction.user.tag, inline: true })
          .setFooter({ text: "You are welcome to rejoin. Please follow the rules next time." }).setTimestamp()] });
      } catch {}
      await member.kick(`${reason} | Kicked by ${interaction.user.tag}`);

      const caseNum = createCase({
        guildId, action: "KICK", userId: target.id, userTag: target.tag,
        moderatorId: interaction.user.id, moderatorTag: interaction.user.tag, reason,
      });

      await interaction.reply({ content: `Successfully kicked **${target.tag}**. Case #${caseNum}\nReason: ${reason}` });
      await sendModLog(interaction.client, guildId, "KICK", target, interaction.user.tag, reason);
    } catch {
      await interaction.reply({ content: "Failed to kick the user.", ephemeral: true });
    }
  },
};

export default command;
