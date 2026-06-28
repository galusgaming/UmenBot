const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Pokaż sklep serwera'),
  async execute(interaction, client) {
    // TODO: implement shop listing
    return interaction.reply({ content: 'Komenda w budowie.', ephemeral: true });
  },
};
