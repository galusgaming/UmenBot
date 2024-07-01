const {
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const { data } = require("./ping");
const Canvas = require("@napi-rs/canvas");
const path = require("path");
const { request } = require("undici");
const level = require("../../Schemas/level");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("level")
    .setDescription("Pokazuje twój poziom na serwerze"),
  async execute(interaction, client) {
    if (!interaction.inGuild())
      return interaction.reply("Nie możesz użyć tej komendy poza serwerem!");
    const calculateXpLevel = require("../../Function/calculateXpLevel");
    const Level = require("../../Schemas/level");
    const { MessageEmbed } = require("discord.js");
    const query = {
      guildID: interaction.guild.id,
      userID: interaction.user.id,
    };
    const userLevel = await Level.findOne(query);
    if (!userLevel) {
      return interaction.reply({
        content: "Nie znaleziono twojego poziomu",
        ephemeral: true,
      });
    }
    const canvas = Canvas.createCanvas(700, 250);
    const ctx = canvas.getContext("2d");
    const background = await Canvas.loadImage(
      path.join(__dirname, "../../imgs/background.png")
    );
    ctx.strokeStyle = "#74037b";

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    const applyText = (canvas, text) => {
      const context = canvas.getContext("2d");

      // Declare a base size of the font
      let fontSize = 70;

      do {
        // Assign the font to the context and decrement it so it can be measured again
        context.font = `${(fontSize -= 10)}px sans-serif`;
        // Compare pixel width of the text to the canvas minus the approximate avatar size
      } while (context.measureText(text).width > canvas.width - 300);

      // Return the result to use in the actual canvas
      return context.font;
    };

    ctx.font = applyText(canvas, interaction.user.username);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      interaction.user.username,
      canvas.width / 2.5,
      canvas.height / 3.5
    );
    ctx.fillText(
      `Poziom: ${userLevel.level}`,
      canvas.width / 1.95,
      canvas.height / 1.7
    );
    ctx.font = "28px sans-serif";
    ctx.fillText(
      `XP: ${userLevel.xp}/${calculateXpLevel(userLevel.level + 1)}`,
      canvas.width / 1.8,
      canvas.height / 1.2
    );
    const { body } = await request(
      interaction.user.displayAvatarURL({ extension: "jpg" })
    );
    const avatar = await Canvas.loadImage(await body.arrayBuffer());

    // If you don't care about the performance of HTTP requests, you can instead load the avatar using
    // const avatar = await Canvas.loadImage(interaction.user.displayAvatarURL({ extension: 'jpg' }));

    // Draw a shape onto the main canvas
    ctx.beginPath();
    ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(avatar, 25, 25, 200, 200);

    const attachment = new AttachmentBuilder(
      await canvas.encode("png"),
      "level-card.png"
    );
    // const embed = new EmbedBuilder()
    //   .setTitle("Twój poziom")
    //   .setDescription(`Twój poziom wynosi: ${userLevel.level}`)
    //   .setThumbnail(interaction.user.displayAvatarURL())
    //   .setImage(attachment.url)
    //   .setColor(0x3399ff)
    //   .setAuthor({
    //     name: "UmenBot",
    //     iconURL: client.user.displayAvatarURL(),
    //   })
    //   .setFooter({
    //     text: `Requested by ${interaction.user.tag}`,
    //     iconURL: interaction.user.displayAvatarURL(),
    //   });
    interaction.reply({ files: [attachment] });
  },
};
