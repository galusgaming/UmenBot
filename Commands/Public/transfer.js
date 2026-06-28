const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Przelej monety innemu użytkownikowi')
    .addUserOption(opt => opt.setName('user').setDescription('Odbiorca').setRequired(true))
    .addNumberOption(opt => opt.setName('amount').setDescription('Ilość').setRequired(true)),
  async execute(interaction, client) {
    // TODO: implement transfer
    return interaction.reply({ content: 'Komenda w budowie.', ephemeral: true });
  },
};
