const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOrCreateWallet, getEconomySettings } = require('../../Function/walletUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Pokaż stan portfela użytkownika')
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

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() })
      .setTitle('Portfel')
      .setDescription(`**${wallet.balance}** ${settings.currencySymbol} ${settings.currencyName}`)
      .setFooter({ text: `Przedmioty w ekwipunku: ${wallet.inventory?.length || 0}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
