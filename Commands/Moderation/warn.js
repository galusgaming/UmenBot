const {} = require("discord.js");
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("warn")
      .setDescription("Komenda do ostrzegania użytkowników, którzy łamią regulamin."),
    /**
     *@param {Channel} channel
     * @param {ChatInputCommandInteraction} interaction
     * @param {Client} client
     */
  
    async execute(interaction, client) {

    }
};