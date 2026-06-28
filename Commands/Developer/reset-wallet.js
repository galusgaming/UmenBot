const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  developer: true,
  data: new SlashCommandBuilder()
    .setName('reset-wallet')
    .setDescription('Zresetuj portfel użytkownika')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt => opt.setName('user').setDescription('Użytkownik').setRequired(true)),
  async execute(interaction, client) {
    // TODO: implement reset-wallet
    return interaction.reply({ content: 'Komenda w budowie.', ephemeral: true });
  },
};
