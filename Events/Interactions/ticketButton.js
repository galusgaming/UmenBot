const { PermissionFlagsBits } = require('discord.js');
const { createTicket, closeTicket, getSettings, applyTicketMeta, hasTicketStaffAccess, parseTicketTopic } = require('../../Function/ticketUtils');

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

      case 'ticket_assign_me': {
        const settings = await getSettings(interaction.guild.id);
        if (!hasTicketStaffAccess(interaction.member, settings, interaction.guild)) {
          return interaction.reply({ content: '❌ Tylko support może przypisywać ticket.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        const meta = parseTicketTopic(interaction.channel?.topic);
        if (!meta) return interaction.editReply({ content: '❌ To nie jest ticket.' });

        await applyTicketMeta(interaction.channel, client, { assigneeId: interaction.user.id });
        await interaction.editReply({ content: `✅ Ticket przypisany do Ciebie.` });
        break;
      }

      case 'ticket_unassign_me': {
        const settings = await getSettings(interaction.guild.id);
        if (!hasTicketStaffAccess(interaction.member, settings, interaction.guild)) {
          return interaction.reply({ content: '❌ Tylko support może zmieniać przypisanie.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        const meta = parseTicketTopic(interaction.channel?.topic);
        if (!meta) return interaction.editReply({ content: '❌ To nie jest ticket.' });

        if (meta.assigneeId && meta.assigneeId !== interaction.user.id && !interaction.memberPermissions?.has?.(PermissionFlagsBits.Administrator)) {
          return interaction.editReply({ content: '❌ Możesz odpiąć tylko ticket przypisany do Ciebie.' });
        }

        await applyTicketMeta(interaction.channel, client, { assigneeId: null });
        await interaction.editReply({ content: '✅ Ticket został odpięty.' });
        break;
      }

      case 'ticket_status_open':
      case 'ticket_status_waiting_staff':
      case 'ticket_status_waiting_user': {
        const settings = await getSettings(interaction.guild.id);
        if (!hasTicketStaffAccess(interaction.member, settings, interaction.guild)) {
          return interaction.reply({ content: '❌ Tylko support może zmieniać status.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        const meta = parseTicketTopic(interaction.channel?.topic);
        if (!meta) return interaction.editReply({ content: '❌ To nie jest ticket.' });

        const nextStatus = interaction.customId === 'ticket_status_open'
          ? 'open'
          : interaction.customId === 'ticket_status_waiting_staff'
            ? 'waiting-staff'
            : 'waiting-user';

        await applyTicketMeta(interaction.channel, client, { status: nextStatus });
        await interaction.editReply({ content: `✅ Status ustawiony: ${nextStatus}.` });
        break;
      }
    }
  },
};