const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOrCreateWallet, addCoins, removeCoins, getEconomySettings } = require('../../Function/walletUtils');

const SYMBOLS = ['🍒', '🍋', '🍇', '🔔', '⭐', '7️⃣'];
// Mnożnik wygranej dla trzech takich samych symboli
const MULTIPLIERS = { '🍒': 2, '🍋': 3, '🍇': 4, '🔔': 6, '⭐': 10, '7️⃣': 20 };
const PAIR_MULTIPLIER = 1.5; // dwa takie same symbole

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Zagraj w automaty (slots)')
    .addNumberOption(opt => opt.setName('amount').setDescription('Stawka').setRequired(true).setMinValue(1)),
  async execute(interaction, client) {
    if (!interaction.inGuild())
      return interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', ephemeral: true });

    const guildID = interaction.guild.id;
    const userID = interaction.user.id;
    const amount = Math.floor(interaction.options.getNumber('amount', true));

    if (amount <= 0) {
      return interaction.reply({ content: 'Stawka musi być większa od zera.', ephemeral: true });
    }

    const settings = await getEconomySettings(guildID);
    await getOrCreateWallet(guildID, userID);

    const removed = await removeCoins(guildID, userID, amount);
    if (!removed) {
      return interaction.reply({ content: `Nie masz wystarczająco środków, aby postawić ${amount} ${settings.currencySymbol}.`, ephemeral: true });
    }

    const reels = [0, 0, 0].map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    let winnings = 0;

    if (reels[0] === reels[1] && reels[1] === reels[2]) {
      winnings = Math.floor(amount * MULTIPLIERS[reels[0]]);
    } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
      winnings = Math.floor(amount * PAIR_MULTIPLIER);
    }

    let updated = removed;
    if (winnings > 0) {
      updated = await addCoins(guildID, userID, winnings);
    }

    const embed = new EmbedBuilder()
      .setColor(winnings > 0 ? 0x57f287 : 0xed4245)
      .setTitle(`🎰 [ ${reels.join(' | ')} ]`)
      .setDescription(
        winnings > 0
          ? `Wygrałeś **${winnings}** ${settings.currencySymbol}!`
          : `Przegrałeś **${amount}** ${settings.currencySymbol}. Spróbuj ponownie!`
      )
      .setFooter({ text: `Stan portfela: ${updated.balance} ${settings.currencyName}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
