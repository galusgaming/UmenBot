const { ChatInputCommandInteraction } = require("discord.js");
const { event } = require("../Client/ready");
module.exports = {
  name: "SlashCommands",
  event: "interactionCreate",
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   *
   */
  async execute(interaction, client) {
    try {
      if (!interaction.isChatInputCommand()) return;

      const command = client.commands.get(interaction.commandName);
      if (!command)
        return interaction.reply({
          content: "This  command is outdated",
          ephemeral: true,
        });
      if (command.developer && interaction.user.id !== "465932200123301928")
        return interaction.reply({
          content: "Ta komenda jest dostępna wyłącznie dla twórcy bota.",
          ephemeral: true,
        });
      await command.execute(interaction, client);
    } catch (error) {
      console.log(error);
      if (interaction.deferred || interaction.replied) {
        try { await interaction.followUp({ content: "There was an error while executing this command", ephemeral: true }); } catch {}
        return;
      }
      return interaction.reply({
        content: "There was an error while executing this command",
        ephemeral: true,
      });
    }
  },
};
