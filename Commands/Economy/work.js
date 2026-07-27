const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOrCreateWallet, addCoins, getEconomySettings } = require('../../Function/walletUtils');
const Wallet = require('../../Schemas/Wallet');

const JOBS = [
  'naprawiłeś router klientowi',
  'skonfigurowałeś sieć LTE',
  'zainstalowałeś kamerę monitoringu',
  'napisałeś kod na stronę WordPress',
  'pomogłeś w serwisie komputerowym',
  'skonfigurowałeś MikroTika',
  'zrobiłeś przegląd serwera',
  'wykryłeś usterkę sprzętową',
];

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
    .setName('work')
    .setDescription('Wykonaj pracę i zdobądź monety'),
  async execute(interaction, client) {
    if (!interaction.inGuild())
      return interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', ephemeral: true });

    const guildID = interaction.guild.id;
    const userID = interaction.user.id;

    const [wallet, settings] = await Promise.all([
      getOrCreateWallet(guildID, userID),
      getEconomySettings(guildID),
    ]);

    const cooldownMs = (settings.workCooldownMinutes || 60) * 60 * 1000;
    const now = Date.now();
    const last = wallet.lastWork ? new Date(wallet.lastWork).getTime() : 0;
    const elapsed = now - last;

    if (elapsed < cooldownMs) {
      const remaining = cooldownMs - elapsed;
      return interaction.reply({
        content: `⏳ Musisz odpocząć przed kolejną pracą. Wróć za **${formatDuration(remaining)}**.`,
        ephemeral: true,
      });
    }

    const min = Math.min(settings.workMin, settings.workMax);
    const max = Math.max(settings.workMin, settings.workMax);
    const earned = Math.floor(Math.random() * (max - min + 1)) + min;
    const job = JOBS[Math.floor(Math.random() * JOBS.length)];

    await Wallet.findOneAndUpdate(
      { guildID, userID },
      { lastWork: new Date(now) },
      { upsert: true }
    );
    const updated = await addCoins(guildID, userID, earned);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('💼 Praca zakończona')
      .setDescription(`Dziś ${job} i zarobiłeś **${earned}** ${settings.currencySymbol} ${settings.currencyName}!`)
      .setFooter({ text: `Nowy stan portfela: ${updated.balance} ${settings.currencyName}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
