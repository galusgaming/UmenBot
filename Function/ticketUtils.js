const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require('discord.js');
const TicketSettings = require('../Schemas/Ticket');
const { recordPanelAudit } = require('./panelAudit');

/**
 * Pobiera ustawienia ticketów dla serwera.
 * Zwraca null jeśli nie skonfigurowano.
 */
async function getSettings(guildId) {
  return TicketSettings.findOne({ guildID: guildId });
}

function statusLabel(status) {
  if (status === 'waiting-user') return 'Czeka na usera';
  if (status === 'waiting-staff') return 'W toku';
  return 'Nowy';
}

function buildTicketControls() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_status_open').setLabel('Nowy').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('ticket_status_waiting_staff').setLabel('W toku').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('ticket_status_waiting_user').setLabel('Czeka na usera').setStyle(ButtonStyle.Success),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_assign_me').setLabel('Przypisz do mnie').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('ticket_unassign_me').setLabel('Odprzypisz ode mnie').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('ticket_close').setLabel('Zamknij ticket').setStyle(ButtonStyle.Danger),
    ),
  ];
}

function buildTicketEmbed({ guild, ticketNumber, user, ticketMeta }) {
  const embed = new EmbedBuilder()
    .setTitle(`🎫 Ticket #${String(ticketNumber).padStart(4, '0')}`)
    .setDescription(
      `Cześć ${user}! Opisz swój problem lub pytanie, a nasz zespół odpowie jak najszybciej.\n\n` +
      `Aby zamknąć ticket, użyj przycisku poniżej.`
    )
    .setColor(0x5865f2)
    .addFields(
      { name: '👤 Użytkownik', value: `${user} (${user.id})`, inline: true },
      { name: '📌 Status', value: statusLabel(ticketMeta?.status), inline: true },
      { name: '🛠️ Przypisany', value: ticketMeta?.assigneeId ? `<@${ticketMeta.assigneeId}>` : 'Brak', inline: true },
    )
    .setTimestamp()
    .setFooter({ text: `${guild.name}`, iconURL: guild.iconURL() });

  return embed;
}

async function findTicketHeaderMessage(channel) {
  const recent = await channel.messages.fetch({ limit: 20 }).catch(() => null);
  if (!recent) return null;

  return recent.find((message) => {
    const embed = message.embeds?.[0];
    return message.author?.bot && embed?.title?.startsWith('🎫 Ticket #');
  }) || null;
}

async function syncTicketHeaderMessage(channel, client) {
  const ticketMeta = parseTicketTopic(channel?.topic);
  if (!ticketMeta) return null;

  const headerMessage = await findTicketHeaderMessage(channel);
  if (!headerMessage) return null;

  const guild = channel.guild;
  const ticketNumberMatch = channel.name?.match(/ticket-(\d+)/i);
  const ticketNumber = ticketNumberMatch ? Number(ticketNumberMatch[1]) : 0;
  const user = await client.users.fetch(ticketMeta.ownerId).catch(() => null);
  if (!user) return null;

  const embed = buildTicketEmbed({ guild, ticketNumber, user, ticketMeta });
  await headerMessage.edit({ embeds: [embed], components: buildTicketControls() }).catch(() => {});
  return headerMessage;
}

async function applyTicketMeta(channel, client, patch) {
  const updated = await updateTicketTopic(channel, patch);
  await syncTicketHeaderMessage(channel, client);
  return updated;
}

function parseTicketTopic(topic) {
  const raw = String(topic || '');
  if (!raw.startsWith('ticket:')) return null;

  const parts = raw.split(';').map((part) => part.trim()).filter(Boolean);
  const [ownerPart, ...metaParts] = parts;
  const ownerId = ownerPart.replace('ticket:', '') || null;
  const meta = { ownerId, status: 'open', assigneeId: null };

  for (const part of metaParts) {
    const [key, ...valueParts] = part.split('=');
    const value = valueParts.join('=').trim();
    if (key === 'status' && value) meta.status = value;
    if (key === 'assignee') meta.assigneeId = value || null;
  }

  return meta;
}

function buildTicketTopic({ ownerId, status = 'open', assigneeId = null }) {
  const safeOwnerId = String(ownerId || '').trim();
  if (!safeOwnerId) throw new Error('owner_id_required');

  const parts = [`ticket:${safeOwnerId}`, `status=${status || 'open'}`];
  if (assigneeId) parts.push(`assignee=${String(assigneeId).trim()}`);
  return parts.join(';');
}

async function updateTicketTopic(channel, patch) {
  const parsed = parseTicketTopic(channel?.topic);
  if (!parsed) throw new Error('not_a_ticket_channel');

  const nextTopic = buildTicketTopic({
    ownerId: parsed.ownerId,
    status: patch?.status || parsed.status,
    assigneeId: Object.prototype.hasOwnProperty.call(patch || {}, 'assigneeId')
      ? patch.assigneeId
      : parsed.assigneeId,
  });

  await channel.setTopic(nextTopic);
  return parseTicketTopic(nextTopic);
}

/**
 * Tworzy nowy kanał ticketu dla użytkownika.
 * Wywoływany przez komendę /ticket i przycisk.
 */
async function createTicket(interaction, user) {
  await interaction.deferReply({ ephemeral: true });

  const settings = await getSettings(interaction.guild.id);
  if (!settings?.staffRoleID || !settings?.logsChannelID) {
    return interaction.editReply({
      content: '❌ System ticketów nie jest skonfigurowany. Skontaktuj się z administracją.',
    });
  }

  // Sprawdź czy user już ma otwarty ticket
  const existingChannel = interaction.guild.channels.cache.find(
    (ch) => ch.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-` ||
             parseTicketTopic(ch.topic)?.ownerId === user.id
  );
  if (existingChannel) {
    return interaction.editReply({
      content: `❌ Masz już otwarty ticket: ${existingChannel}`,
    });
  }

  // Inkrementuj licznik ticketów
  const updatedSettings = await TicketSettings.findOneAndUpdate(
    { guildID: interaction.guild.id },
    { $inc: { ticketCount: 1 } },
    { new: true }
  );
  const ticketNumber = updatedSettings.ticketCount;

  // Uprawnienia kanału
  const permissionOverwrites = [
    {
      id: interaction.guild.id, // @everyone
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      id: settings.staffRoleID,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ManageMessages,
      ],
    },
  ];

  // Dodaj bota do uprawnień
  if (interaction.guild.members.me) {
    permissionOverwrites.push({
      id: interaction.guild.members.me.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
      ],
    });
  }

  const channelOptions = {
    name: `ticket-${String(ticketNumber).padStart(4, '0')}`,
    type: ChannelType.GuildText,
    topic: buildTicketTopic({ ownerId: user.id }),
    permissionOverwrites,
  };

  if (settings.categoryID) {
    const category = interaction.guild.channels.cache.get(settings.categoryID);
    if (category) channelOptions.parent = category.id;
  }

  const ticketChannel = await interaction.guild.channels.create(channelOptions);

  await recordPanelAudit({
    guildID: interaction.guild.id,
    actorId: user.id,
    actorName: user.username,
    action: 'ticket_created',
    targetType: 'ticket',
    targetId: ticketChannel.id,
    details: { ticketNumber, ownerId: user.id },
  })

  const ticketMeta = parseTicketTopic(channelOptions.topic);
  const embed = buildTicketEmbed({ guild: interaction.guild, ticketNumber, user, ticketMeta });
  const components = buildTicketControls();

  const staffRole = interaction.guild.roles.cache.get(settings.staffRoleID);
  await ticketChannel.send({
    content: staffRole ? `${user} | ${staffRole}` : `${user}`,
    embeds: [embed],
    components,
  });

  await interaction.editReply({
    content: `✅ Twój ticket został otwarty: ${ticketChannel}`,
  });
}

/**
 * Zamyka ticket: generuje transkrypt, wysyła na logi, usuwa kanał.
 */
async function closeTicket(interaction) {
  await interaction.reply({
    content: '🔒 Zamykanie ticketu, generowanie transkryptu...',
  });

  try {
    await closeTicketChannel({
      channel: interaction.channel,
      guild: interaction.guild,
      logsChannelID: (await getSettings(interaction.guild.id))?.logsChannelID || null,
      closedByTag: interaction.user.tag,
      client: interaction.client,
      audit: {
        guildID: interaction.guild.id,
        actorId: interaction.user.id,
        actorName: interaction.user.username,
        action: 'ticket_closed',
        targetType: 'ticket',
        targetId: interaction.channel.id,
      },
    });
  } catch (err) {
    console.error('Error closing ticket', err);
    if (interaction.replied || interaction.deferred) {
      return interaction.followUp({
        content: '❌ Nie udało się zamknąć ticketu.',
        ephemeral: true,
      }).catch(() => {});
    }
    return interaction.reply({ content: '❌ Nie udało się zamknąć ticketu.', ephemeral: true });
  }
}

async function closeTicketChannel({ channel, guild, logsChannelID, closedByTag, client, audit = null }) {
  const ticketMeta = parseTicketTopic(channel?.topic);
  if (!ticketMeta) {
    throw new Error('not_a_ticket_channel');
  }

  if (!logsChannelID) {
    throw new Error('logs_channel_not_configured');
  }

  const transcript = await generateTranscript(channel);
  const transcriptBuffer = Buffer.from(transcript, 'utf-8');
  const attachment = new AttachmentBuilder(transcriptBuffer, {
    name: `transkrypt-${channel.name}.txt`,
  });

  const logsChannel = guild.channels.cache.get(logsChannelID);
  if (logsChannel) {
    const userId = ticketMeta.ownerId;
    const user = await client.users.fetch(userId).catch(() => null);

    const logEmbed = new EmbedBuilder()
      .setTitle(`🔒 Ticket zamknięty — ${channel.name}`)
      .setColor(0xed4245)
      .addFields(
        { name: '👤 Właściciel', value: user ? `${user.tag} (${user.id})` : userId, inline: true },
        { name: '🛡️ Zamknięty przez', value: closedByTag, inline: true },
        { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
      )
      .setTimestamp();

    await logsChannel.send({ embeds: [logEmbed], files: [attachment] });
  }

  await new Promise((resolve) => setTimeout(resolve, 3000));
  await channel.delete(`Ticket zamknięty przez ${closedByTag}`).catch(() => {});

  if (audit) {
    await recordPanelAudit(audit);
  }
}

/**
 * Generuje transkrypt tekstowy z historii kanału.
 */
async function generateTranscript(channel) {
  const messages = [];
  let lastId;

  while (true) {
    const fetched = await channel.messages.fetch({ limit: 100, before: lastId });
    if (!fetched.size) break;
    messages.push(...fetched.values());
    lastId = fetched.last().id;
    if (fetched.size < 100) break;
    if (messages.length >= 500) break; // limit bezpieczeństwa
  }

  messages.reverse(); // od najstarszej

  const header = [
    `═══════════════════════════════════════`,
    `  TRANSKRYPT: ${channel.name}`,
    `  Serwer:     ${channel.guild.name}`,
    `  Wiadomości: ${messages.length}`,
    `  Data:       ${new Date().toLocaleString('pl-PL')}`,
    `═══════════════════════════════════════`,
    '',
  ].join('\n');

  const lines = messages.map((msg) => {
    const time = msg.createdAt.toLocaleString('pl-PL');
    const content = msg.content || (msg.embeds.length ? '[embed]' : '[brak treści]');
    const attachments = msg.attachments.size
      ? `\n  📎 ${msg.attachments.map((a) => a.url).join('\n  📎 ')}`
      : '';
    return `[${time}] ${msg.author.tag}: ${content}${attachments}`;
  });

  return header + lines.join('\n');
}

function hasTicketStaffAccess(member, settings, guild) {
  if (!member) return false;
  if (member.permissions?.has?.(PermissionFlagsBits.Administrator)) return true;
  if (settings?.staffRoleID && member.roles?.cache?.has?.(settings.staffRoleID)) return true;
  return false;
}

module.exports = {
  createTicket,
  closeTicket,
  closeTicketChannel,
  getSettings,
  parseTicketTopic,
  buildTicketTopic,
  updateTicketTopic,
  syncTicketHeaderMessage,
  applyTicketMeta,
  buildTicketControls,
  buildTicketEmbed,
  hasTicketStaffAccess,
  statusLabel,
};