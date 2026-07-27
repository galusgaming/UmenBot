const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { removeCoins } = require('../../Function/walletUtils');
const { getEconomySettings, formatCoins } = require('../../Function/economyUtils');

module.exports = {
  developer: true,
  data: new SlashCommandBuilder()
    .setName('take-coins')
    .setDescription('Zabierz monety z portfela użytkownika')
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
    const result = await removeCoins(interaction.guild.id, user.id, amount);

    if (!result.ok) {
      return interaction.reply({
        content: `${user.username} nie ma wystarczających środków.`,
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('Monety zabrane')
      .setDescription(
        `Zabrano **${formatCoins(amount, economy.currencyName)}** użytkownikowi **${user.username}**.`
      )
      .addFields({ name: 'Nowe saldo', value: formatCoins(result.wallet.balance, economy.currencyName) });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
