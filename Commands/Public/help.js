const {
  SlashCommandBuilder,
  EmbedBuilder,
  Message,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const fs = require("fs");
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
    const commandFolders = fs
      .readdirSync("./Commands")
      .filter((folder) => !folder.startsWith("."));
    const commandByCategory = {};
    for (const folder of commandFolders) {
      const commandFiles = fs
        .readdirSync(`./Commands/${folder}`)
        .filter((file) => file.endsWith(".js"));
      const commands = [];
      for (const file of commandFiles) {
        const { default: command } = await import(`../${folder}/${file}`);
        if (!command.data) {
          continue;
        } else {
          commands.push({
            name: command.data.name,
            description: command.data.description,
          });
        }
      }
      commandByCategory[folder] = commands;
    }
    const dropdownOption = Object.keys(commandByCategory).map((folder) => ({
      label: folder,
      value: folder,
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("helpMenu")
      .setPlaceholder("Select a category")
      .addOptions(
        ...dropdownOption.map((option) => ({
          label: option.label,
          value: option.value,
        }))
      );

    const embed = new EmbedBuilder()
      .setTitle("Help Center")
      .setColor(0x3399ff)
      .setDescription("Wybierz kategorię komend")
      .setThumbnail(`${client.user.displayAvatarURL()}`)
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      });
    const row = new ActionRowBuilder().addComponents(selectMenu);

    interaction.editReply({
      embeds: [embed],
      components: [row],
    });
    const filter = (i) => i.isStringSelectMenu() && i.customId === "helpMenu";

    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 15000,
    });
    collector.on("collect", async (i) => {
      const selectedCategory = i.values[0];
      const categoryCommands = commandByCategory[selectedCategory];
      const categoryEmbed = new EmbedBuilder()
        .setTitle(`${selectedCategory} Commands!`)
        .setDescription("Here are the commands in this category")
        .setThumbnail(`${client.user.displayAvatarURL()}`)
        .addFields(
          categoryCommands.map((command) => ({
            name: command.name,
            value: command.description,
          }))
        );
      await i.update({ embeds: [categoryEmbed] });
    });
  },
};
