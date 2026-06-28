const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Kup przedmiot ze sklepu')
    .addStringOption(opt => opt.setName('item').setDescription('Nazwa przedmiotu').setRequired(true)),
  async execute(interaction, client) {
    // TODO: implement buy
    return interaction.reply({ content: 'Komenda w budowie.', ephemeral: true });
  },
};
