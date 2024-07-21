const {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    Client,
    EmbedBuilder,
  } = require("discord.js");
  const Tenor = require("tenorjs").client({
    Key: "AIzaSyCfKMT6FuUqriZFPxDlm8R7tJtWWWRGTpM", // https://developers.google.com/tenor/guides/quickstart
    Filter: "off", // "off", "low", "medium", "high", not case sensitive
    Locale: "en_US", // Your locale here, case-sensitivity depends on input
    MediaFilter: "minimal", // either minimal or basic, not case sensitive
    DateFormat: "D/MM/YYYY - H:mm:ss A", // Change this accordingly
  });
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("kotami")
      .setDescription("Wysyła losowego GIFa z kotami"),
  
    /**
     *
     * @param {ChatInputCommandInteraction} interaction
     * @param {Client} client
     */
  
    async execute(interaction, client) {
        await interaction.deferReply();
        Tenor.Search.Random("cat", "1")
        .then((Results) => {
          Results.forEach((Post) => {
            const gif = new EmbedBuilder()
              .setColor(0x3399ff)
              .setImage(`${Post.media_formats.gif.url}`)
              .setFooter({
                text:`Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
            });
            
            interaction.editReply({ embeds: [gif] });
        });
        });
    },
  };
  