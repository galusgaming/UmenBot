const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Zwraca nam pomoc"),
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   */
  async execute(interaction, client) {
    await interaction.deferReply();
    const data = [];
    const devData = [];
    data.push("Help & Resources Commands");
    data.push(client.commands);
    const embed = new EmbedBuilder()
      .setTitle("Help Center")
      .setColor(0x3399ff)
      .setDescription("Help Command Guide")
      .addFields({
        name: "Page 1",
        value: "Help & Resources Commands (button1)",
      })
      .addFields({ name: "Page 2", value: "Moderation Commands (button2)" })
      .addFields({ name: "Page 3", value: "Developer Commands (button3)" });
    const embed2 = new EmbedBuilder()
      .setColor(0x3399ff)
      .setTitle("Community Commands")
      .addFields();
    interaction.editReply({
      content: data.toString(),
      ephemeral: true,
    });
  },
};
