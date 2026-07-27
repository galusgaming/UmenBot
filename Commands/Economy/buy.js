const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ShopItem = require('../../Schemas/ShopItem');
const Wallet = require('../../Schemas/Wallet');
const { getOrCreateWallet, removeCoins, getEconomySettings } = require('../../Function/walletUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Kup przedmiot ze sklepu')
    .addStringOption(opt => opt.setName('item').setDescription('Nazwa przedmiotu').setRequired(true)),
  async execute(interaction, client) {
    if (!interaction.inGuild())
      return interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', ephemeral: true });

    const guildID = interaction.guild.id;
    const userID = interaction.user.id;
    const itemName = interaction.options.getString('item', true).trim();

    const [item, settings] = await Promise.all([
      ShopItem.findOne({ guildID, name: new RegExp(`^${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }),
      getEconomySettings(guildID),
    ]);

    if (!item) {
      return interaction.reply({ content: `Nie znaleziono przedmiotu **${itemName}** w sklepie.`, ephemeral: true });
    }

    await getOrCreateWallet(guildID, userID);
    const updated = await removeCoins(guildID, userID, item.price);

    if (!updated) {
      return interaction.reply({
        content: `Nie masz wystarczająco środków, aby kupić **${item.name}** (koszt: ${item.price} ${settings.currencySymbol}).`,
        ephemeral: true,
      });
    }

    await Wallet.findOneAndUpdate(
      { guildID, userID },
      { $push: { inventory: { name: item.name, price: item.price, roleID: item.roleID || null, purchasedAt: new Date() } } }
    );

    let roleNote = '';
    if (item.roleID) {
      try {
        const member = await interaction.guild.members.fetch(userID);
        await member.roles.add(item.roleID);
        roleNote = '\n🎖️ Otrzymałeś nową rolę!';
      } catch (e) {
        roleNote = '\n⚠️ Nie udało się nadać roli — skontaktuj się z administracją.';
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('✅ Zakup zrealizowany')
      .setDescription(`Kupiłeś **${item.name}** za **${item.price}** ${settings.currencySymbol}.${roleNote}`)
      .setFooter({ text: `Pozostały stan portfela: ${updated.balance} ${settings.currencyName}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
