const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addCoins } = require('../../Function/walletUtils');
const { getEconomySettings, formatCoins } = require('../../Function/economyUtils');

module.exports = {
  developer: true,
  data: new SlashCommandBuilder()
    .setName('add-coins')
    .setDescription('Dodaj monety do portfela użytkownika')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((opt) => opt.setName('user').setDescription('Użytkownik').setRequired(true))
    .addNumberOption((opt) => opt.setName('amount').setDescription('Ilość').setRequired(true).setMinValue(1)),
  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: 'Użyj tej komendy na serwerze.', ephemeral: true });
    }

    const user = interaction.options.getUser('user', true);
    const amount = Math.floor(interaction.options.getNumber('amount', true));
    const economy = await getEconomySettings(interaction.guild.id);
    const wallet = await addCoins(interaction.guild.id, user.id, amount);

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('Monety dodane')
      .setDescription(
        `Dodano **${formatCoins(amount, economy.currencyName)}** użytkownikowi **${user.username}**.`
      )
      .addFields({ name: 'Nowe saldo', value: formatCoins(wallet.balance, economy.currencyName) });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
