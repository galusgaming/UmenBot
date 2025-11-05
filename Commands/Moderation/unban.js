const {
  SlashCommandBuilder,
  Interaction,
  Client,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
module.exports = {
  /**
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   *
   */
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription(
      "Odbanowuje użytkownika, komenda jedynie dla osób z administracji"
    )
    .addStringOption((option) =>
      option
        .setName("user")
        .setDescription("ID użytkownika do odbanowania")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Powód odbanowania")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction, client) {
    if (!interaction.inGuild())
      return interaction.reply("Nie możesz użyć tej komendy poza serwerem!");
    const target = interaction.options.getString("user");
    const reason = interaction.options.getString("reason");

    await interaction.deferReply();
    interaction.guild.bans.fetch().then((bans) => {
      if (bans.size == 0) {
        return interaction.editReply("Brak zbanowanych użytkowników");
      }
      const user = bans.find((user) => user.user.id === target);
      if (!user) {
        return interaction.editReply("Podany użytkownik nie jest zbanowany");
      }
      const embed = new EmbedBuilder()
        .setTitle("Ktoś właśnie wrócił")
        .setColor(0x3399ff)
        .addFields(
          {
            name: "Użytkownik",
            value: `<@${user.user.id}>`,
            inline: true,
          },
          {
            name: "Powód",
            value: reason,
            inline: true,
          }
        )
        .setThumbnail(`${user.user.displayAvatarURL()}`)
        .setAuthor({
          name: interaction.user.tag,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setFooter({
          text: `Unbanned by ${interaction.user.tag}`,
        });
      interaction.guild.members.unban(target, { reason: reason });
      interaction.editReply({ embeds: [embed] });
    });
  },
};
