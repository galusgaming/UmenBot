const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Zagraj w coinflip (orzeł/ reszka)')
    .addNumberOption(opt => opt.setName('amount').setDescription('Ile stawiasz').setRequired(true)),
  async execute(interaction, client) {
    // TODO: implement coinflip
    return interaction.reply({ content: 'Komenda w budowie.', ephemeral: true });
  },
};
