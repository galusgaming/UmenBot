const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  Client,
  EmbedBuilder,
} = require("discord.js");
const {
  botAuthor,
  botVersion,
  description,
} = require("../../configs/config.js");
const { name } = require("../../Events/Client/ready.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Podstawowe informacje na temat bota"),
  /**
   *@param {Channel} channel
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
