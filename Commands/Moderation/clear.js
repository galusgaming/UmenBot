const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
module.exports = {
  /**
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   */
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Usuwa wiadomości z kanału")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Ilość wiadomości do usunięcia")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("Użytkownik, którego wiadomości chcesz usunąć")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction, client) {
    const { options, channel } = interaction;
    let amount = options.getInteger("amount");
    const target = options.getUser("target");
    const multiMsg = amount === 1 ? "wiadomość" : "wiadomości";
    if (!amount || amount < 1 || amount > 100) {
      return interaction.reply({
        content: "Podaj liczbę od 1 do 100",
        ephemeral: true,
      });
    }

    try {
      const channelMessages = await channel.messages.fetch();
      if (channelMessages.size === 0) {
        return interaction.reply({
          content: "Brak wiadomości do usunięcia",
          ephemeral: true,
        });
      }
      if (amount > channelMessages.size) amount = channelMessages.size;
      const clearEmbed = new EmbedBuilder().setColor(0x3399ff);
      await interaction.deferReply({ ephemeral: true });
      let messagesToDelete = [];
      if (target) {
        let i = 0;
        channelMessages.forEach((msg) => {
          if (msg.author.id === target.id && messagesToDelete.length < amount) {
            messagesToDelete.push(msg);
            i++;
          }
        });

        clearEmbed.setDescription(
          `\`✅\`Usunięto ${messagesToDelete.length} ${multiMsg} od ${target} z kanału ${channel}`
        );
      } else {
        messagesToDelete = channelMessages.first(amount);
        clearEmbed.setDescription(
          `\`✅\`Usunięto ${messagesToDelete.length} ${multiMsg} z kanału ${channel}`
        );
      }
      if (messagesToDelete.length > 0) {
        await channel.bulkDelete(messagesToDelete, true);
      }
      await interaction.editReply({ embeds: [clearEmbed] });
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: "Wystąpił błąd podczas usuwania wiadomości",
        ephemeral: true,
      });
    }
  },
};
