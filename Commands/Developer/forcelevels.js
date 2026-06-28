const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  developer: true,
  data: new SlashCommandBuilder()
    .setName("forcelevels")
    .setDescription("Wymusza utworzenie systemu leveli (profile) dla wszystkich członków serwera")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    if (!interaction.inGuild())
      return interaction.reply({ content: "Ta komenda działa tylko na serwerze.", ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    const Level = require("../../Schemas/level");

    let members;
    try {
      members = await interaction.guild.members.fetch();
    } catch (e) {
      console.warn("[forcelevels] Nie udało się pobrać wszystkich członków, używam cache:", e.message);
      members = interaction.guild.members.cache;
    }

    let totalMembers = 0;
    let created = 0;
    let already = 0;
    let bots = 0;
    let errors = 0;

    for (const [, member] of members) {
      if (!member || !member.user) continue;
      if (member.user.bot) {
        bots++;
        continue;
      }
      totalMembers++;
      const query = { guildID: String(interaction.guild.id), userID: String(member.user.id) };
      try {
        const exists = await Level.findOne(query);
        if (!exists) {
          await Level.create({ ...query, xp: 0, level: 0 });
          created++;
        } else {
          already++;
        }
      } catch (err) {
        console.error("[forcelevels] błąd dla", member.user.id, err);
        errors++;
      }
    }

    return interaction.editReply({
      content: `Skan ukończony.
Łącznie członków (bez botów): ${totalMembers}
Utworzono profili: ${created}
Już istniało: ${already}
Botów pominięto: ${bots}
Błędów: ${errors}`,
      ephemeral: true,
    });
  },
};
