const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Pokaż stan portfela użytkownika'),
  async execute(interaction, client) {
    // TODO: implement balance display
    return interaction.reply({ content: 'Komenda w budowie.', ephemeral: true });
  },
};
