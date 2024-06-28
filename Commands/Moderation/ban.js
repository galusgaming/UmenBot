const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription(
      "Banuje użytkownika, komenda jedynie dla osób z administracji"
    )
    .addUserOption((option) =>
      option
        .setName("użytkownik")
        .setDescription("Użytkownik do zbanowania")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

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
      .setDescription("hej");

    interaction.editReply({ embeds: [embed] });
  },
};
