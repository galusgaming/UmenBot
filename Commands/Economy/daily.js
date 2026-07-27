const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOrCreateWallet, addCoins, getEconomySettings } = require('../../Function/walletUtils');
const Wallet = require('../../Schemas/Wallet');

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDuration(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (!h && s) parts.push(`${s}s`);
  return parts.join(' ') || '0m';
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Odbierz codzienną nagrodę'),
  async execute(interaction, client) {
    if (!interaction.inGuild())
      return interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', ephemeral: true });

    const guildID = interaction.guild.id;
    const userID = interaction.user.id;

    const [wallet, settings] = await Promise.all([
      getOrCreateWallet(guildID, userID),
      getEconomySettings(guildID),
    ]);

    const now = Date.now();
    const last = wallet.lastDaily ? new Date(wallet.lastDaily).getTime() : 0;
    const elapsed = now - last;

    if (elapsed < DAY_MS) {
      const remaining = DAY_MS - elapsed;
      return interaction.reply({
        content: `⏳ Już odebrałeś dzisiejszą nagrodę. Wróć za **${formatDuration(remaining)}**.`,
        ephemeral: true,
      });
    }

    await Wallet.findOneAndUpdate(
      { guildID, userID },
      { lastDaily: new Date(now) },
      { upsert: true }
    );
    const updated = await addCoins(guildID, userID, settings.dailyAmount);

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('🎁 Codzienna nagroda')
      .setDescription(`Odebrałeś **${settings.dailyAmount}** ${settings.currencySymbol} ${settings.currencyName}!`)
      .setFooter({ text: `Nowy stan portfela: ${updated.balance} ${settings.currencyName}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
