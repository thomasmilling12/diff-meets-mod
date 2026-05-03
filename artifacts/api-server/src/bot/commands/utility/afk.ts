import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "../../client";
import { setAfk, clearAfk, getAfk } from "../../db/afk";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("afk")
    .setDescription("Set or clear your AFK status")
    .addSubcommand(s => s.setName("set").setDescription("Go AFK")
      .addStringOption(o => o.setName("reason").setDescription("Why you're AFK (default: AFK)").setRequired(false)))
    .addSubcommand(s => s.setName("clear").setDescription("Come back from AFK"))
    .addSubcommand(s => s.setName("check").setDescription("Check if a user is AFK")
      .addUserOption(o => o.setName("user").setDescription("User to check").setRequired(true))),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "set") {
      const reason = interaction.options.getString("reason") ?? "AFK";
      setAfk(interaction.user.id, guildId, reason);
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xffa500).setTitle("💤 AFK Set")
          .setDescription(`You are now AFK.\n**Reason:** ${reason}\nAnyone who mentions you will be notified.`)
          .setTimestamp()],
        ephemeral: true,
      });

    } else if (sub === "clear") {
      const was = clearAfk(interaction.user.id, guildId);
      await interaction.reply({ content: was ? "✅ Welcome back! Your AFK status has been cleared." : "You weren't AFK.", ephemeral: true });

    } else {
      const target = interaction.options.getUser("user", true);
      const afk = getAfk(target.id, guildId);
      if (!afk) {
        await interaction.reply({ content: `**${target.tag}** is not AFK.`, ephemeral: true });
      } else {
        const embed = new EmbedBuilder().setColor(0xffa500).setTitle("💤 User is AFK")
          .addFields(
            { name: "User", value: target.tag, inline: true },
            { name: "Reason", value: afk.reason, inline: true },
            { name: "Since", value: `<t:${afk.set_at}:R>`, inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },
};

export default command;
