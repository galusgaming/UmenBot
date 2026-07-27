const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { resetWallet } = require('../../Function/walletUtils');
const { getEconomySettings, formatCoins } = require('../../Function/economyUtils');

module.exports = {
  developer: true,
  data: new SlashCommandBuilder()
    .setName('reset-wallet')
    .setDescription('Zresetuj portfel użytkownika')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((opt) => opt.setName('user').setDescription('Użytkownik').setRequired(true)),
  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: 'Użyj tej komendy na serwerze.', ephemeral: true });
    }

    const user = interaction.options.getUser('user', true);
    const economy = await getEconomySettings(interaction.guild.id);
    await resetWallet(interaction.guild.id, user.id);

    const embed = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle('Portfel zresetowany')
      .setDescription(`Portfel użytkownika **${user.username}** został wyzerowany.`)
      .addFields({ name: 'Saldo', value: formatCoins(0, economy.currencyName) });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
