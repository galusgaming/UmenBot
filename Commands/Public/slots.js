const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Zagraj w automaty (slots)')
    .addNumberOption(opt => opt.setName('amount').setDescription('Stawka').setRequired(true)),
  async execute(interaction, client) {
    // TODO: implement slots
    return interaction.reply({ content: 'Komenda w budowie.', ephemeral: true });
  },
};
