const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  developer: true,
  data: new SlashCommandBuilder()
    .setName('add-coins')
    .setDescription('Dodaj monety do portfela użytkownika')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt => opt.setName('user').setDescription('Użytkownik').setRequired(true))
    .addNumberOption(opt => opt.setName('amount').setDescription('Ilość').setRequired(true)),
  async execute(interaction, client) {
    // TODO: implement add-coins
    return interaction.reply({ content: 'Komenda w budowie.', ephemeral: true });
  },
};
