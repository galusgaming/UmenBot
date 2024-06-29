const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  PermissionFlagsBits,
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
    .setName("ban")
    .setDescription(
      "Banuje użytkownika, komenda jedynie dla osób z administracji"
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Użytkownik do zbanowania")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Powód zbanowania")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  /**
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   */

  async execute(interaction, client) {
    const target = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");

    await interaction.deferReply();
    const targetUser = await interaction.guild.members.fetch(target);
    if (targetUser.id === interaction.guild.ownerId) {
      await interaction.editReply("Nie możesz zbanować właściciela serwera");
      return;
    }
    const targetUserRolePosition = targetUser.roles.highest.position;
    const requestUserRolePosition = interaction.member.roles.highest.position;
    const botRolePosition = interaction.guild.members.me.roles.highest.position;
    if (targetUserRolePosition >= requestUserRolePosition) {
      await interaction.editReply(
        "Nie możesz zbanować użytkownika z wyższą lub równą rolą"
      );
      return;
    }
    if (targetUserRolePosition >= botRolePosition) {
      await interaction.editReply(
        "Nie mogę zbanować użytkownika z wyższą lub równą rolą"
      );
      return;
    }
    try {
      await interaction.guild.members.ban(target, { reason: reason });

      Tenor.Search.Random("ban", "1")
        .then((Results) => {
          Results.forEach((Post) => {
            const embed = new EmbedBuilder()

              .setTitle("Ktoś właśnie Odleciał")
              .setColor(0x3399ff)
              .setThumbnail(`${target.displayAvatarURL()}`)
              .setImage(`${Post.media_formats.gif.url}`)
              .addFields(
                {
                  name: "Zbanowany",
                  value: `${target}`,
                  inline: true,
                },
                {
                  name: "Powód",
                  value: `${reason}`,
                  inline: true,
                }
              );

            interaction.editReply({ embeds: [embed] });
          });
        })
        .catch(console.error);
    } catch (error) {
      console.error(error);
      await interaction.editReply(
        "Wystąpił błąd podczas banowania użytkownika"
      );
    }
  },
};
