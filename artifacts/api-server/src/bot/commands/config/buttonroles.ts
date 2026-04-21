import {
  SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType, TextChannel,
} from "discord.js";
import type { Command } from "../../client";
import { addButtonRole, removeButtonRole, getButtonRoles, setMessageId } from "../../db/buttonRoles";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("buttonroles")
    .setDescription("Manage self-assignable button roles")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(s => s.setName("add").setDescription("Add a button role")
      .addRoleOption(o => o.setName("role").setDescription("Role to assign").setRequired(true))
      .addStringOption(o => o.setName("label").setDescription("Button label").setRequired(true))
      .addChannelOption(o => o.setName("channel").setDescription("Channel to post the panel in").addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addStringOption(o => o.setName("emoji").setDescription("Button emoji").setRequired(false)))
    .addSubcommand(s => s.setName("remove").setDescription("Remove a button role")
      .addRoleOption(o => o.setName("role").setDescription("Role to remove").setRequired(true)))
    .addSubcommand(s => s.setName("post").setDescription("Post/refresh the role selection panel")
      .addChannelOption(o => o.setName("channel").setDescription("Channel to post in").addChannelTypes(ChannelType.GuildText).setRequired(true))),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "add") {
      const role = interaction.options.getRole("role", true);
      const label = interaction.options.getString("label", true);
      const channel = interaction.options.getChannel("channel", true);
      const emoji = interaction.options.getString("emoji") ?? undefined;
      addButtonRole(guildId, channel.id, role.id, label, emoji);
      await interaction.reply({ content: `Button role **${label}** → <@&${role.id}> added. Use \`/buttonroles post\` to update the panel.` });

    } else if (sub === "remove") {
      const role = interaction.options.getRole("role", true);
      const removed = removeButtonRole(guildId, role.id);
      await interaction.reply({ content: removed ? `Button role for <@&${role.id}> removed.` : "That role was not a button role.", ephemeral: true });

    } else if (sub === "post") {
      const targetChannel = interaction.options.getChannel("channel", true);
      const channel = interaction.guild?.channels.cache.get(targetChannel.id) as TextChannel | undefined;
      if (!channel) {
        await interaction.reply({ content: "Could not find that channel.", ephemeral: true });
        return;
      }

      const roles = getButtonRoles(guildId).filter(r => r.channel_id === targetChannel.id);
      if (roles.length === 0) {
        await interaction.reply({ content: "No button roles configured for this channel. Use `/buttonroles add` first.", ephemeral: true });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Role Selection")
        .setDescription("Click a button below to add or remove a role.");

      const buttons = roles.map(r =>
        new ButtonBuilder()
          .setCustomId(`role_toggle_${r.role_id}`)
          .setLabel(r.label)
          .setStyle(ButtonStyle.Primary)
          .setEmoji(r.emoji ?? { name: "🏷️" })
      );

      const rows: ActionRowBuilder<ButtonBuilder>[] = [];
      for (let i = 0; i < buttons.length; i += 5) {
        rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(i, i + 5)));
      }

      const msg = await channel.send({ embeds: [embed], components: rows });
      setMessageId(guildId, targetChannel.id, msg.id);
      await interaction.reply({ content: `Role panel posted in <#${targetChannel.id}>.` });
    }
  },
};

export default command;
