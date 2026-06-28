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

/**
 * Pobiera ustawienia ticketów dla serwera.
 * Zwraca null jeśli nie skonfigurowano.
 */
async function getSettings(guildId) {
  return TicketSettings.findOne({ guildID: guildId });
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
             ch.topic === `ticket:${user.id}`
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
    topic: `ticket:${user.id}`,
    permissionOverwrites,
  };

  if (settings.categoryID) {
    const category = interaction.guild.channels.cache.get(settings.categoryID);
    if (category) channelOptions.parent = category.id;
  }

  const ticketChannel = await interaction.guild.channels.create(channelOptions);

  // Embed powitalny w kanale ticketu
  const embed = new EmbedBuilder()
    .setTitle(`🎫 Ticket #${String(ticketNumber).padStart(4, '0')}`)
    .setDescription(
      `Cześć ${user}! Opisz swój problem lub pytanie, a nasz zespół odpowie jak najszybciej.\n\n` +
      `Aby zamknąć ticket, kliknij przycisk poniżej.`
    )
    .setColor(0x5865f2)
    .addFields({ name: '👤 Użytkownik', value: `${user} (${user.id})`, inline: true })
    .setTimestamp()
    .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('🔒 Zamknij ticket')
      .setStyle(ButtonStyle.Danger)
  );

  const staffRole = interaction.guild.roles.cache.get(settings.staffRoleID);
  await ticketChannel.send({
    content: staffRole ? `${user} | ${staffRole}` : `${user}`,
    embeds: [embed],
    components: [row],
  });

  await interaction.editReply({
    content: `✅ Twój ticket został otwarty: ${ticketChannel}`,
  });
}

/**
 * Zamyka ticket: generuje transkrypt, wysyła na logi, usuwa kanał.
 */
async function closeTicket(interaction) {
  const channel = interaction.channel;

  // Sprawdź czy to kanał ticketu
  if (!channel.topic?.startsWith('ticket:')) {
    return interaction.reply({
      content: '❌ Ta komenda działa tylko w kanałach ticketów.',
      ephemeral: true,
    });
  }

  const settings = await getSettings(interaction.guild.id);
  if (!settings?.logsChannelID) {
    return interaction.reply({
      content: '❌ Kanał logów nie jest skonfigurowany.',
      ephemeral: true,
    });
  }

  await interaction.reply({
    content: '🔒 Zamykanie ticketu, generowanie transkryptu...',
  });

  // Pobierz wiadomości (max 500)
  const transcript = await generateTranscript(channel);
  const transcriptBuffer = Buffer.from(transcript, 'utf-8');
  const attachment = new AttachmentBuilder(transcriptBuffer, {
    name: `transkrypt-${channel.name}.txt`,
  });

  // Wyślij transkrypt na kanał logów
  const logsChannel = interaction.guild.channels.cache.get(settings.logsChannelID);
  if (logsChannel) {
    const userId = channel.topic.replace('ticket:', '');
    const user = await interaction.client.users.fetch(userId).catch(() => null);

    const logEmbed = new EmbedBuilder()
      .setTitle(`🔒 Ticket zamknięty — ${channel.name}`)
      .setColor(0xed4245)
      .addFields(
        { name: '👤 Właściciel', value: user ? `${user.tag} (${user.id})` : userId, inline: true },
        { name: '🛡️ Zamknięty przez', value: `${interaction.user.tag}`, inline: true },
        { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
      )
      .setTimestamp();

    await logsChannel.send({ embeds: [logEmbed], files: [attachment] });
  }

  // Usuń kanał po 3 sekundach
  await new Promise((resolve) => setTimeout(resolve, 3000));
  await channel.delete(`Ticket zamknięty przez ${interaction.user.tag}`).catch(() => {});
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

module.exports = { createTicket, closeTicket, getSettings };