const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ShopItem = require('../../Schemas/ShopItem');
const { getEconomySettings } = require('../../Function/walletUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Pokaż sklep serwera'),
  async execute(interaction, client) {
    if (!interaction.inGuild())
      return interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', ephemeral: true });

    const guildID = interaction.guild.id;
    const [items, settings] = await Promise.all([
      ShopItem.find({ guildID }).sort({ price: 1 }).limit(25).lean(),
      getEconomySettings(guildID),
    ]);

    if (!items.length) {
      return interaction.reply({ content: 'Sklep tego serwera jest obecnie pusty.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🛒 Sklep — ${interaction.guild.name}`)
      .setDescription(
        items
          .map((item) => {
            const roleNote = item.roleID ? ` _(nadaje rolę)_` : '';
            const desc = item.description ? `\n> ${item.description}` : '';
            return `**${item.name}** — ${item.price} ${settings.currencySymbol}${roleNote}${desc}`;
          })
          .join('\n\n')
      )
      .setFooter({ text: 'Użyj /buy item:<nazwa> aby kupić przedmiot' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
