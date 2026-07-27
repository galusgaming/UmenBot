const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOrCreateWallet, addCoins, removeCoins, getEconomySettings } = require('../../Function/walletUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Przelej monety innemu użytkownikowi')
    .addUserOption(opt => opt.setName('user').setDescription('Odbiorca').setRequired(true))
    .addNumberOption(opt => opt.setName('amount').setDescription('Ilość').setRequired(true).setMinValue(1)),
  async execute(interaction, client) {
    if (!interaction.inGuild())
      return interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', ephemeral: true });

    const target = interaction.options.getUser('user', true);
    const amount = Math.floor(interaction.options.getNumber('amount', true));
    const guildID = interaction.guild.id;
    const userID = interaction.user.id;

    if (target.id === userID) {
      return interaction.reply({ content: 'Nie możesz przelać monet samemu sobie.', ephemeral: true });
    }
    if (target.bot) {
      return interaction.reply({ content: 'Nie możesz przelać monet botowi.', ephemeral: true });
    }
    if (amount <= 0) {
      return interaction.reply({ content: 'Kwota musi być większa od zera.', ephemeral: true });
    }

    const settings = await getEconomySettings(guildID);
    await getOrCreateWallet(guildID, userID);
    await getOrCreateWallet(guildID, target.id);

    const updatedSender = await removeCoins(guildID, userID, amount);
    if (!updatedSender) {
      return interaction.reply({ content: `Nie masz wystarczająco środków (${amount} ${settings.currencySymbol}).`, ephemeral: true });
    }

    const updatedReceiver = await addCoins(guildID, target.id, amount);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('💸 Przelew wykonany')
      .setDescription(`Przelałeś **${amount}** ${settings.currencySymbol} do ${target}.`)
      .setFooter({ text: `Twój nowy stan portfela: ${updatedSender.balance} ${settings.currencyName}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
