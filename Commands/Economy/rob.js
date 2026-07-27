const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Wallet = require('../../Schemas/Wallet');
const { getOrCreateWallet, addCoins, removeCoins, getEconomySettings } = require('../../Function/walletUtils');

const ROB_COOLDOWN_MS = 60 * 60 * 1000; // 1 godzina
const MIN_VICTIM_BALANCE = 50;

function formatDuration(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (m || !h) parts.push(`${m}m`);
  return parts.join(' ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rob')
    .setDescription('Spróbuj okraść innego gracza')
    .addUserOption(opt => opt.setName('user').setDescription('Ofiara').setRequired(true)),
  async execute(interaction, client) {
    if (!interaction.inGuild())
      return interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', ephemeral: true });

    const target = interaction.options.getUser('user', true);
    const guildID = interaction.guild.id;
    const userID = interaction.user.id;

    const settings = await getEconomySettings(guildID);

    if (!settings.robEnabled) {
      return interaction.reply({ content: 'Okradanie jest wyłączone na tym serwerze.', ephemeral: true });
    }
    if (target.id === userID) {
      return interaction.reply({ content: 'Nie możesz okraść samego siebie.', ephemeral: true });
    }
    if (target.bot) {
      return interaction.reply({ content: 'Nie możesz okraść bota.', ephemeral: true });
    }

    const robberWallet = await getOrCreateWallet(guildID, userID);
    const now = Date.now();
    const last = robberWallet.lastRob ? new Date(robberWallet.lastRob).getTime() : 0;
    if (now - last < ROB_COOLDOWN_MS) {
      return interaction.reply({
        content: `⏳ Musisz poczekać przed kolejną próbą napadu. Wróć za **${formatDuration(ROB_COOLDOWN_MS - (now - last))}**.`,
        ephemeral: true,
      });
    }

    const victimWallet = await getOrCreateWallet(guildID, target.id);

    if (victimWallet.balance < MIN_VICTIM_BALANCE) {
      return interaction.reply({ content: `${target.username} nie ma wystarczająco monet, aby się opłacało go okradać.`, ephemeral: true });
    }

    await Wallet.findOneAndUpdate({ guildID, userID }, { lastRob: new Date(now) }, { upsert: true });

    const success = Math.random() * 100 < settings.robSuccessChance;

    if (success) {
      const stolen = Math.max(1, Math.floor(victimWallet.balance * (settings.robMaxPercent / 100) * Math.random()));
      await removeCoins(guildID, target.id, stolen);
      const updatedRobber = await addCoins(guildID, userID, stolen);

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('🕵️ Napad się udał!')
        .setDescription(`Ukradłeś **${stolen}** ${settings.currencySymbol} od ${target}.`)
        .setFooter({ text: `Twój nowy stan portfela: ${updatedRobber.balance} ${settings.currencyName}` })
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    const penalty = Math.max(1, Math.floor(robberWallet.balance * 0.15));
    const updatedRobber = await removeCoins(guildID, userID, penalty);

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('🚨 Napad się nie udał!')
      .setDescription(`Zostałeś złapany i zapłaciłeś grzywnę **${penalty}** ${settings.currencySymbol}.`)
      .setFooter({ text: `Twój nowy stan portfela: ${updatedRobber ? updatedRobber.balance : robberWallet.balance} ${settings.currencyName}` })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  },
};
