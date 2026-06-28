const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rob')
    .setDescription('Spróbuj okraść innego gracza')
    .addUserOption(opt => opt.setName('user').setDescription('Ofiara').setRequired(true)),
  async execute(interaction, client) {
    // TODO: implement rob
    return interaction.reply({ content: 'Komenda w budowie.', ephemeral: true });
  },
};
