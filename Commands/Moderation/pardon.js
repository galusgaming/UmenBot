const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const UserWarn = require("../../Schemas/warn");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pardon")
    .setDescription("Usuń określoną ilość ostrzeżeń z użytkownika")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("Użytkownik, któremu chcesz usunąć ostrzeżenia").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt.setName("amount").setDescription("Ilość ostrzeżeń do usunięcia").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("Powód cofnięcia ostrzeżeń").setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    if (!interaction.inGuild())
      return interaction.reply({ content: "Ta komenda działa tylko na serwerze.", ephemeral: true });

    const user = interaction.options.getUser("user");
    const amount = Math.max(0, interaction.options.getInteger("amount") || 0);
    const reason = interaction.options.getString("reason") || "Brak podanego powodu";

    if (amount <= 0) {
      return interaction.reply({ content: "Podaj poprawną ilość ostrzeżeń do usunięcia (liczba > 0).", ephemeral: true });
    }

    try {
      const query = { guildID: interaction.guild.id, userID: user.id };
      const doc = await UserWarn.findOne(query);

      if (!doc || !doc.warns || doc.warns <= 0) {
        return interaction.reply({ content: `Użytkownik ${user.tag} nie ma aktualnie ostrzeżeń.`, ephemeral: true });
      }

      const before = doc.warns;
      const after = Math.max(0, before - amount);

      doc.warns = after;
      await doc.save();

      const embed = new EmbedBuilder()
        .setTitle("Pardon — cofnięto ostrzeżenia")
        .setDescription(`Usunięto ${before - after} ostrzeżeń użytkownikowi ${user.tag}`)
        .addFields(
          { name: "Przed", value: `${before}`, inline: true },
          { name: "Po", value: `${after}`, inline: true },
          { name: "Powód", value: reason, inline: false }
        )
        .setColor("#2ECC71");

      return interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      console.error("pardon command error:", err);
      return interaction.reply({ content: "Wystąpił błąd podczas usuwania ostrzeżeń.", ephemeral: true });
    }
  },
};
