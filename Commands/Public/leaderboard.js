const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Wyświetla top 10 użytkowników wg poziomu na serwerze"),

  async execute(interaction, client) {
    if (!interaction.inGuild())
      return interaction.reply({ content: "Ta komenda działa tylko na serwerze.", ephemeral: true });

    const Level = require("../../Schemas/level");

    const guildId = String(interaction.guild.id);
    const top = await Level.find({ guildID: guildId })
      .sort({ level: -1, xp: -1 })
      .limit(10)
      .lean();

    if (!top || top.length === 0) {
      return interaction.reply({ content: "Brak danych poziomów na tym serwerze.", ephemeral: true });
    }

    const lines = await Promise.all(
      top.map(async (doc, i) => {
        let display = doc.userID;
        try {
          const member = await interaction.guild.members.fetch(String(doc.userID)).catch(() => null);
          if (member && member.user) display = `${member.user.username}#${member.user.discriminator}`;
        } catch (_) {}
        return `#${i + 1} — ${display} — Poziom ${doc.level} (${doc.xp} XP)`;
      })
    );

    return interaction.reply({ content: `Top poziomów na tym serwerze:\n${lines.join("\n")}` });
  },
};
