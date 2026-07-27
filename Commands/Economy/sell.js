const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Wallet = require('../../Schemas/Wallet');
const { getOrCreateWallet, addCoins, getEconomySettings } = require('../../Function/walletUtils');

const SELLBACK_RATE = 0.5; // gracz odzyskuje 50% ceny zakupu

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Sprzedaj przedmiot ze swojego ekwipunku')
    .addStringOption(opt => opt.setName('item').setDescription('Nazwa przedmiotu').setRequired(true)),
  async execute(interaction, client) {
    if (!interaction.inGuild())
      return interaction.reply({ content: 'Ta komenda działa tylko na serwerze.', ephemeral: true });

    const guildID = interaction.guild.id;
    const userID = interaction.user.id;
    const itemName = interaction.options.getString('item', true).trim();

    const [wallet, settings] = await Promise.all([
      getOrCreateWallet(guildID, userID),
      getEconomySettings(guildID),
    ]);

    const inventory = wallet.inventory || [];
    const idx = inventory.findIndex((entry) => String(entry.name).toLowerCase() === itemName.toLowerCase());

    if (idx === -1) {
      return interaction.reply({ content: `Nie posiadasz przedmiotu **${itemName}** w ekwipunku.`, ephemeral: true });
    }

    const owned = inventory[idx];
    const refund = Math.floor((owned.price || 0) * SELLBACK_RATE);

    await Wallet.findOneAndUpdate(
      { guildID, userID },
      { $pull: { inventory: { _id: owned._id } } }
    );

    if (owned.roleID) {
      try {
        const member = await interaction.guild.members.fetch(userID);
        await member.roles.remove(owned.roleID);
      } catch (e) {
        // rola mogła zostać już usunięta lub bot nie ma uprawnień — pomijamy
      }
    }

    const updated = await addCoins(guildID, userID, refund);

    const embed = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle('💰 Przedmiot sprzedany')
      .setDescription(`Sprzedałeś **${owned.name}** i otrzymałeś **${refund}** ${settings.currencySymbol}.`)
      .setFooter({ text: `Nowy stan portfela: ${updated.balance} ${settings.currencyName}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
