    const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const UserWarn = require("../../Schemas/warn");
const WarnRule = require("../../Schemas/setWarn");

// small parser for durations like 30s, 5m, 1h, 2d -> milliseconds
function parseDurationToMs(input) {
  if (!input || typeof input !== "string") return null;
  const match = input.match(/^\s*(\d+)\s*(s|m|h|d)\s*$/i);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a user.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to warn")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for the warning")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: "Ta komenda działa tylko na serwerze.", ephemeral: true });
    }

    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");

    try {
      // get or create user warn document
      const query = { guildID: interaction.guild.id, userID: user.id };
      const update = { $inc: { warns: 1 } };
      const opts = { upsert: true, new: true, setDefaultsOnInsert: true };

      // findOneAndUpdate on the userWarn model; note model name is 'userWarn'
      const updated = await UserWarn.findOneAndUpdate(query, update, opts);

      const newCount = updated.warns;

  // check if there is a rule for this warn count
  // Use threshold matching: find the rule with the highest `warns` <= newCount
  const rule = await WarnRule.findOne({ guildID: interaction.guild.id, warns: { $lte: newCount } }).sort({ warns: -1 });

      let actionResult = null;

      if (rule && rule.action && rule.action !== "none") {
        const action = rule.action;
        const meta = rule.meta;

        // fetch member
        let member;
        try {
          member = await interaction.guild.members.fetch(user.id);
        } catch (e) {
          member = null;
        }

        if (action === "ban") {
          try {
            await interaction.guild.members.ban(user.id, { reason: `Auto-ban by warn system: ${reason}` });
            actionResult = `Użytkownik został zbanowany (${newCount} warn).`;
          } catch (err) {
            actionResult = `Próba zbanowania nie powiodła się: ${err.message}`;
          }
        } else if (action === "kick") {
          if (member) {
            try {
              await member.kick(`Auto-kick by warn system: ${reason}`);
              actionResult = `Użytkownik został wyrzucony (kick) (${newCount} warn).`;
            } catch (err) {
              actionResult = `Próba wyrzucenia nie powiodła się: ${err.message}`;
            }
          } else {
            actionResult = "Nie mogę znaleźć użytkownika na serwerze, nie można wykonać kicka.";
          }
        } else if (action === "timeout") {
          if (!meta) {
            actionResult = "Reguła timeout nie zawiera czasu (meta). Nie wykonano wyciszenia.";
          } else if (!member) {
            actionResult = "Nie mogę znaleźć użytkownika na serwerze, nie można wykonać timeout.";
          } else {
            const ms = parseDurationToMs(meta);
            if (!ms) {
              actionResult = "Niepoprawny format czasu w regule (meta). Użyj np. 10m, 1h, 30s.";
            } else {
              try {
                // max timeout is 28 days in Discord
                const MAX = 28 * 24 * 60 * 60 * 1000;
                const duration = Math.min(ms, MAX);
                await member.timeout(duration, `Auto-timeout by warn system: ${reason}`);
                actionResult = `Użytkownik został wyciszony na ${meta} (zgodnie z taryfikatorem).`;
              } catch (err) {
                actionResult = `Próba wyciszenia nie powiodła się: ${err.message}`;
              }
            }
          }
        }
      }

      const embed = new EmbedBuilder()
        .setTitle("Ostrzeżenie")
        .setDescription(`${user.tag} został ostrzeżony. Powód: ${reason}`)
        .addFields(
          { name: "Ilość ostrzeżeń", value: `${newCount}`, inline: true },
    { name: "Akcja automatyczna", value: rule && rule.action ? `${rule.action}${rule.meta ? ` (${rule.meta})` : ""}` : "Brak", inline: true }
        )
        .setColor("#FFA500");

      if (actionResult) embed.addFields({ name: "Wykonana akcja", value: actionResult });

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error("warn command error:", err);
      return interaction.reply({ content: "Wystąpił błąd podczas nakładania ostrzeżenia.", ephemeral: true });
    }
  },
};