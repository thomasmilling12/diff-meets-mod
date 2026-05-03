import { ContextMenuCommandBuilder, ApplicationCommandType, UserContextMenuCommandInteraction, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";
import type { Command } from "../../client";

const command: Command = {
  data: new ContextMenuCommandBuilder()
    .setName("Quick Ban")
    .setType(ApplicationCommandType.User)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers) as unknown as import("discord.js").SlashCommandBuilder,

  async execute(interaction: UserContextMenuCommandInteraction) {
    const modal = new ModalBuilder()
      .setCustomId(`quickban_${interaction.targetId}`)
      .setTitle(`Ban ${interaction.targetUser.tag}`);

    const reasonInput = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Ban Reason")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(500);

    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput));
    await interaction.showModal(modal);
  },
};

export default command;
