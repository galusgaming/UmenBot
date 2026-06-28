const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');
const TicketSettings = require('../../Schemas/Ticket');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-ticket')
    .setDescription('Skonfiguruj system ticketów na serwerze')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((opt) =>
      opt
        .setName('panel')
        .setDescription('Kanał gdzie pojawi się przycisk tworzenia ticketu')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addRoleOption((opt) =>
      opt
        .setName('staff')
        .setDescription('Rola która ma dostęp do wszystkich ticketów')
        .setRequired(true)
    )
    .addChannelOption((opt) =>
      opt
        .setName('logi')
        .setDescription('Kanał gdzie zapisywane są transkrypty zamkniętych ticketów')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption((opt) =>
      opt
        .setName('kategoria')
        .setDescription('Kategoria w której tworzone są kanały ticketów (opcjonalne)')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(false)
    ),

  async execute(interaction) {
    const panelChannel  = interaction.options.getChannel('panel');
    const staffRole     = interaction.options.getRole('staff');
    const logsChannel   = interaction.options.getChannel('logi');
    const category      = interaction.options.getChannel('kategoria');

    // Zapisz ustawienia do bazy
    await TicketSettings.findOneAndUpdate(
      { guildID: interaction.guild.id },
      {
        staffRoleID:   staffRole.id,
        logsChannelID: logsChannel.id,
        categoryID:    category?.id || null,
      },
      { upsert: true, new: true }
    );

    // Wyślij panel na wskazany kanał
    const embed = new EmbedBuilder()
      .setTitle('🎫 Wsparcie — Otwórz Ticket')
      .setDescription(
        'Masz problem, pytanie lub chcesz skontaktować się z obsługą?\n' +
        'Kliknij przycisk poniżej, aby otworzyć prywatny ticket.\n\n' +
        '> 📌 Opisz dokładnie swój problem po otwarciu ticketu.\n' +
        '> ⏱️ Nasz zespół odpowie jak najszybciej.'
      )
      .setColor(0x5865f2)
      .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_create')
        .setLabel('📩 Utwórz ticket')
        .setStyle(ButtonStyle.Primary)
    );

    await panelChannel.send({ embeds: [embed], components: [row] });

    await interaction.reply({
      content:
        `✅ System ticketów skonfigurowany!\n` +
        `• Panel: ${panelChannel}\n` +
        `• Staff: ${staffRole}\n` +
        `• Logi: ${logsChannel}` +
        (category ? `\n• Kategoria: ${category.name}` : ''),
      ephemeral: true,
    });
  },
};