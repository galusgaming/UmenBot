const {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    Client,
    EmbedBuilder,
  } = require("discord.js");
  const Tenor = require("tenorjs").client({
    Key: "AIzaSyCfKMT6FuUqriZFPxDlm8R7tJtWWWRGTpM", // https://developers.google.com/tenor/guides/quickstart
    Filter: "medium", // "off", "low", "medium", "high", not case sensitive
    Locale: "en_US", // Your locale here, case-sensitivity depends on input
    MediaFilter: "minimal", // either minimal or basic, not case sensitive
    DateFormat: "D/MM/YYYY - H:mm:ss A", // Change this accordingly
  });
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("kiss")
      .setDescription("Wysyła wybranemu użytkownikowi losowego GIFa z pocałunkiem`").addUserOption(
        option => option.setName('target').setDescription('Użytkownik, któremu chcesz wysłać pocałunek').setRequired(true)
      ),
  
    /**
     *
     * @param {ChatInputCommandInteraction} interaction
     * @param {Client} client
     */
  
    async execute(interaction, client) {
        await interaction.deferReply();
        Tenor.Search.Random("kiss", "1")
        .then((Results) => {
          Results.forEach((Post) => {
            const gif = new EmbedBuilder()
              .setColor(0x3399ff)
              .setDescription(`${interaction.user} przesyła buziaki ${interaction.options.getUser('target')}`)
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
  