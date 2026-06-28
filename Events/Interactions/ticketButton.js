const { createTicket, closeTicket } = require('../../Function/ticketUtils');

module.exports = {
  name: 'TicketButtons',
  event: 'interactionCreate',
  execute: async (interaction, client) => {
    // Obsługuj tylko przyciski z prefixem ticket_
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('ticket_')) return;

    switch (interaction.customId) {
      case 'ticket_create':
        await createTicket(interaction, interaction.user);
        break;

      case 'ticket_close':
        await closeTicket(interaction);
        break;
    }
  },
};