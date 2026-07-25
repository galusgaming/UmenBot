const {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    Client,
    EmbedBuilder,
  } = require("discord.js");
  const { getRandomGifUrl } = require("../../Function/tenorGif");
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("kiss")
      .setDescription("Wysyła wybranemu użytkownikowi losowego GIFa z pocałunkiem").addUserOption(
        option => option.setName('target').setDescription('Użytkownik, któremu chcesz wysłać pocałunek').setRequired(true)
      ),
  
    /**
     *
     * @param {ChatInputCommandInteraction} interaction
     * @param {Client} client
     */
  
    async execute(interaction, client) {
        try {
        await interaction.deferReply();
        const gifUrl = await getRandomGifUrl("kiss", {
          Filter: "medium",
          Locale: "en_US",
        });

        const gif = new EmbedBuilder()
          .setColor(0x3399ff)
          .setDescription(`${interaction.user} przesyła buziaki ${interaction.options.getUser('target')}`)
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
  