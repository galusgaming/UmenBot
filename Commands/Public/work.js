const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Wykonaj pracę i zdobądź monety'),
  async execute(interaction, client) {
    // TODO: implement work command
    return interaction.reply({ content: 'Komenda w budowie.', ephemeral: true });
  },
};
