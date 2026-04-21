import {
  SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction,
  ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder,
} from "discord.js";
import type { Command } from "../../client";
import { getVerificationConfig, setVerificationConfig } from "../../db/verification";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("verify-setup")
    .setDescription("Set up a verification gate with a button")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("send").setDescription("Send the verification message")
      .addChannelOption(o => o.setName("channel").setDescription("Channel to send the verify message in").addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addRoleOption(o => o.setName("role").setDescription("Role given on verification").setRequired(true))
      .addStringOption(o => o.setName("message").setDescription("Custom message text").setRequired(false)))
    .addSubcommand(s => s.setName("disable").setDescription("Disable verification"))
    .addSubcommand(s => s.setName("status").setDescription("Show verification config")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "send") {
      const channel = interaction.options.getChannel("channel", true);
      const role = interaction.options.getRole("role", true);
      const text = interaction.options.getString("message") ?? "Click the button below to verify yourself and gain access to the server.";

      const embed = new EmbedBuilder()
        .setColor(0x00cc66)
        .setTitle("✅ Verification Required")
        .setDescription(text)
        .setTimestamp();

      const button = new ButtonBuilder()
        .setCustomId("verify_click")
        .setLabel("Verify")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
      const textChannel = interaction.guild?.channels.cache.get(channel.id);
      if (!textChannel?.isTextBased()) {
        await interaction.reply({ content: "Invalid channel.", ephemeral: true });
        return;
      }
      const msg = await (textChannel as import("discord.js").TextChannel).send({ embeds: [embed], components: [row] });
      setVerificationConfig(guildId, { channel_id: channel.id, message_id: msg.id, role_id: role.id, welcome_text: text });
      await interaction.reply({ content: `Verification message sent to <#${channel.id}>. Members will receive <@&${role.id}> on verify.` });
    } else if (sub === "disable") {
      setVerificationConfig(guildId, { channel_id: null, message_id: null, role_id: null });
      await interaction.reply({ content: "Verification disabled." });
    } else {
      const c = getVerificationConfig(guildId);
      const embed = new EmbedBuilder()
        .setColor(c.role_id ? 0x00cc66 : 0x888888)
        .setTitle("Verification Config")
        .addFields(
          { name: "Status", value: c.role_id ? "Enabled" : "Disabled", inline: true },
          { name: "Channel", value: c.channel_id ? `<#${c.channel_id}>` : "Not set", inline: true },
          { name: "Role", value: c.role_id ? `<@&${c.role_id}>` : "Not set", inline: true },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};

export default command;
