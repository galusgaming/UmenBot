const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOrCreateWallet, getEconomySettings } = require('../../Function/walletUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Pokaż swój ekwipunek')
    .addUserOption(opt => opt.setName('user').setDescription('Użytkownik do sprawdzenia').setRequired(false)),
  async execute(interaction, client) {
    if (!interaction.inGuild())
      return interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', ephemeral: true });

    const target = interaction.options.getUser('user') || interaction.user;
    const guildID = interaction.guild.id;

    const [wallet, settings] = await Promise.all([
      getOrCreateWallet(guildID, target.id),
      getEconomySettings(guildID),
    ]);

    const items = wallet.inventory || [];

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() })
      .setTitle('🎒 Ekwipunek')
      .setFooter({ text: `Stan portfela: ${wallet.balance} ${settings.currencyName}` })
      .setTimestamp();

    if (!items.length) {
      embed.setDescription('Ekwipunek jest pusty. Sprawdź `/shop` i kup coś przez `/buy`.');
      return interaction.reply({ embeds: [embed] });
    }

    // Grupujemy identyczne przedmioty, żeby nie zaśmiecać embeda duplikatami
    const grouped = new Map();
    for (const item of items) {
      const key = item.name;
      const entry = grouped.get(key) || { name: item.name, price: item.price, roleID: item.roleID, count: 0 };
      entry.count += 1;
      grouped.set(key, entry);
    }

    const lines = Array.from(grouped.values()).map((entry) => {
      const countLabel = entry.count > 1 ? ` x${entry.count}` : '';
      const roleNote = entry.roleID ? ' _(nadaje rolę)_' : '';
      return `**${entry.name}**${countLabel} — ${entry.price} ${settings.currencySymbol}${roleNote}`;
    });

    embed.setDescription(lines.join('\n'));
    return interaction.reply({ embeds: [embed] });
  },
};
