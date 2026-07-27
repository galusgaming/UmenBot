const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOrCreateWallet, addCoins, removeCoins, getEconomySettings } = require('../../Function/walletUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Zagraj w coinflip (orzeł/reszka)')
    .addNumberOption(opt => opt.setName('amount').setDescription('Ile stawiasz').setRequired(true).setMinValue(1))
    .addStringOption(opt =>
      opt.setName('side')
        .setDescription('Na co stawiasz')
        .setRequired(false)
        .addChoices({ name: 'Orzeł', value: 'orzel' }, { name: 'Reszka', value: 'reszka' })
    ),
  async execute(interaction, client) {
    if (!interaction.inGuild())
      return interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', ephemeral: true });

    const guildID = interaction.guild.id;
    const userID = interaction.user.id;
    const amount = Math.floor(interaction.options.getNumber('amount', true));
    const chosenSide = interaction.options.getString('side') || (Math.random() < 0.5 ? 'orzel' : 'reszka');

    if (amount <= 0) {
      return interaction.reply({ content: 'Stawka musi być większa od zera.', ephemeral: true });
    }

    const settings = await getEconomySettings(guildID);
    await getOrCreateWallet(guildID, userID);

    const removed = await removeCoins(guildID, userID, amount);
    if (!removed) {
      return interaction.reply({ content: `Nie masz wystarczająco środków, aby postawić ${amount} ${settings.currencySymbol}.`, ephemeral: true });
    }

    const result = Math.random() < 0.5 ? 'orzel' : 'reszka';
    const win = result === chosenSide;
    const resultLabel = result === 'orzel' ? 'Orzeł' : 'Reszka';

    let updated;
    if (win) {
      updated = await addCoins(guildID, userID, amount * 2);
    } else {
      updated = removed;
    }

    const embed = new EmbedBuilder()
      .setColor(win ? 0x57f287 : 0xed4245)
      .setTitle(`🪙 Coinflip — wypadło: ${resultLabel}`)
      .setDescription(
        win
          ? `Wygrałeś! Otrzymujesz **${amount * 2}** ${settings.currencySymbol}.`
          : `Przegrałeś **${amount}** ${settings.currencySymbol}. Następnym razem się uda!`
      )
      .setFooter({ text: `Stan portfela: ${updated.balance} ${settings.currencyName}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
