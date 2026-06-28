const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Odbierz codzienną nagrodę'),
  async execute(interaction, client) {
    // TODO: implement daily reward
    return interaction.reply({ content: 'Komenda w budowie.', ephemeral: true });
  },
};
