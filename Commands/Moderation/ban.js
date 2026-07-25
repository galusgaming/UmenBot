const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { getRandomGifUrl } = require("../../Function/tenorGif");
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

      try {
        const gifUrl = await getRandomGifUrl("ban", {
          Locale: "en_US",
        });

        const embed = new EmbedBuilder()
          .setTitle("Ktoś właśnie Odleciał")
          .setColor(0x3399ff)
          .setThumbnail(`${target.displayAvatarURL()}`)
          .setImage(gifUrl)
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

        await interaction.editReply({ embeds: [embed] });
      } catch (gifError) {
        console.error(gifError);
        await interaction.editReply(
          `Użytkownik został zbanowany. Powód: ${reason}`
        );
      }
    } catch (error) {
      console.error(error);
      await interaction.editReply(
        "Wystąpił błąd podczas banowania użytkownika"
      );
    }
  },
};
