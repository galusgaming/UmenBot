const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("banuj")
    .setDescription(
      "Banuje użytkownika, komenda jedynie dla osób z administracji"
    ),

  /**
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   */

  async execute(interaction, client) {
    await interaction.deferReply();

    const embed = new EmbedBuilder()
      .setTitle("Informacje o Bocie")
      .setColor(0x3399ff)
      .setThumbnail("https://i.ibb.co/RHf1rBV/UMEN-bot.png")
      .setDescription(description)
      .addFields(
        {
          name: "Autor",
          value: botAuthor,
          inline: true,
        },
        {
          name: "Wersja",
          value: botVersion,
          inline: true,
        }
      );

    interaction.editReply({ embeds: [embed] });
  },
};
