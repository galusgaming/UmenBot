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
  execute(interaction, client) {
    try {
      if (!interaction.isChatInputCommand()) return;

      const command = client.commands.get(interaction.commandName);
      if (!command)
        return interaction.reply({
          content: "This  command is outdated",
          ephemeral: true,
        });
      if (command.developer && interaction.user.id !== "465932200123301928")
        return interaction({
          content: "Ta Komenda jest dostępna wyłącznie dla twórcy bota",
        });
      command.execute(interaction, client);
    } catch (error) {
      console.log(error);
      return interaction.reply({
        content: "There was an error while executing this command",
        ephemeral: true,
      });
    }
  },
};
