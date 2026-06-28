const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Sprzedaj przedmiot ze swojego ekwipunku')
    .addStringOption(opt => opt.setName('item').setDescription('Nazwa przedmiotu').setRequired(true)),
  async execute(interaction, client) {
    // TODO: implement sell
    return interaction.reply({ content: 'Komenda w budowie.', ephemeral: true });
  },
};
