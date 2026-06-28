const { SlashCommandBuilder } = require('discord.js');
const { createTicket } = require('../../Function/ticketUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Otwórz nowy ticket wsparcia'),

  async execute(interaction) {
    await createTicket(interaction, interaction.user);
  },
};