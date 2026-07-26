const {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    Client,
    EmbedBuilder,
  } = require("discord.js");
  const { getRandomGifUrl } = require("../../Function/tenorGif");
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("cat")
      .setDescription("Wysyła losowego GIFa z kotami"),
  
    /**
     *
     * @param {ChatInputCommandInteraction} interaction
     * @param {Client} client
     */
  
    async execute(interaction, client) {
        try {
        await interaction.deferReply();
        const gifUrl = await getRandomGifUrl("cat", {
          Locale: "pl_PL",
        });

        const gif = new EmbedBuilder()
          .setColor(0x3399ff)
          .setImage(gifUrl)
          .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL(),
          });

        await interaction.editReply({ embeds: [gif] });
        } catch (error) {
          console.error(error);
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply("Nie udało się pobrać GIFa. Spróbuj ponownie później.");
          }
        }
    },
  };
  