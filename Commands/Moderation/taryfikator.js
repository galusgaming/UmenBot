const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const Warn = require("../../Schemas/setWarn");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("taryfikator")
    .setDescription("Utwórz lub zaktualizuj wpis w taryfikatorze ostrzeżeń dla serwera")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("dodaj")
        .setDescription("Dodaj nowy wpis do taryfikatora")
        .addIntegerOption((opt) =>
          opt.setName("warns").setDescription("Ilość ostrzeżeń").setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("action")
            .setDescription("Akcja do wykonania (none, timeout, kick, ban)")
            .setRequired(true)
            .addChoices(
              { name: "none", value: "none" },
              { name: "timeout", value: "timeout" },
              { name: "kick", value: "kick" },
              { name: "ban", value: "ban" }
            )
        )
        .addStringOption((opt) =>
          opt
            .setName("meta")
            .setDescription("Dodatkowa informacja, np. czas dla timeout (np. 1h, 30m)")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("usun")
        .setDescription("Usuń istniejący wpis z taryfikatora")
        .addIntegerOption((opt) =>
          opt.setName("warns").setDescription("Ilość ostrzeżeń do usunięcia").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("lista").setDescription("Wyświetla wpisy taryfikatora ostrzeżeń dla serwera")
    ),

  async execute(interaction) {
    if (!interaction.inGuild())
      return interaction.reply({ content: "Ta komenda działa tylko na serwerze.", ephemeral: true });

    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "dodaj") {
      const warns = interaction.options.getInteger("warns");
      const action = interaction.options.getString("action");
      const meta = interaction.options.getString("meta") || null;

      if (warns <= 0) {
        return interaction.reply({ content: "Ilość ostrzeżeń musi być większa niż 0.", ephemeral: true });
      }

      try {
        const query = { guildID: interaction.guild.id, warns };
        const update = { action, meta };
        const opts = { upsert: true, new: true, setDefaultsOnInsert: true };

        await Warn.findOneAndUpdate(query, update, opts);

        return interaction.reply({ content: `Zapisano wpis taryfikatora: przy ${warns} ostrzeżeniach -> ${action}${meta ? ` (info: ${meta})` : ""}`, ephemeral: true });
      } catch (err) {
        console.error("taryfikator command error:", err);
        return interaction.reply({ content: "Wystąpił błąd podczas zapisywania taryfikatora.", ephemeral: true });
      }
    } else if (subcommand === "usun") {
      const warns = interaction.options.getInteger("warns");

      try {
        const deleted = await Warn.findOneAndDelete({ guildID: interaction.guild.id, warns });

        if (!deleted) return interaction.reply({ content: `Nie znaleziono wpisu dla ${warns} ostrzeżeń.`, ephemeral: true });

        return interaction.reply({ content: `Usunięto wpis taryfikatora dla ${warns} ostrzeżeń.`, ephemeral: true });
      } catch (err) {
        console.error("taryfikator-usun error:", err);
        return interaction.reply({ content: "Wystąpił błąd podczas usuwania wpisu.", ephemeral: true });
      }
    } else if (subcommand === "lista") {
      try {
        const entries = await Warn.find({ guildID: interaction.guild.id }).sort({ warns: 1 }).lean();

        if (!entries || entries.length === 0) return interaction.reply({ content: "Brak wpisów w taryfikatorze dla tego serwera.", ephemeral: true });

        const description = entries.map((e) => `**${e.warns}** — ${e.action}${e.meta ? ` (${e.meta})` : ""}`).join("\n");

        const embed = new EmbedBuilder().setTitle("Taryfikator ostrzeżeń").setDescription(description).setColor("#FFA500").setFooter({ text: `Serwer: ${interaction.guild.name}` });

        return interaction.reply({ embeds: [embed], ephemeral: false });
      } catch (err) {
        console.error("taryfikator-lista error:", err);
        return interaction.reply({ content: "Wystąpił błąd podczas pobierania taryfikatora.", ephemeral: true });
      }
    }
  },
};
 
