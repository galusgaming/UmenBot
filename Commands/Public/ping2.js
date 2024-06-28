const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  Client,
} = require("discord.js");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping2")
    .setDescription("Zwraca nam pong"),
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   */

  async execute(interaction, client) {
    await interaction.deferReply();

    const reply = await interaction.fetchReply();

    const ping = reply.createdTimestamp - interaction.createdTimestamp;

    interaction.editReply({
      content: `🏓latency: Client: ${ping}ms | Websocket ${client.ws.ping}`,
      ephemeral: true,
    });
  },
};
