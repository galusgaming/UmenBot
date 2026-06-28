const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  developer: true,
  data: new SlashCommandBuilder()
    .setName('take-coins')
    .setDescription('Zabierz monety z portfela użytkownika')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt => opt.setName('user').setDescription('Użytkownik').setRequired(true))
    .addNumberOption(opt => opt.setName('amount').setDescription('Ilość').setRequired(true)),
  async execute(interaction, client) {
    // TODO: implement take-coins
    return interaction.reply({ content: 'Komenda w budowie.', ephemeral: true });
  },
};
