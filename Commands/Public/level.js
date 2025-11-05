const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
// Prefer @napi-rs/canvas, fallback to node-canvas if needed
let CanvasLib;
try {
  CanvasLib = require("@napi-rs/canvas");
} catch (_) {
  CanvasLib = require("canvas");
}
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
    const canvas = CanvasLib.createCanvas(700, 250);
    const ctx = canvas.getContext("2d");
    // Try to make sure fonts are available when using @napi-rs/canvas
    try {
      if (CanvasLib.GlobalFonts && CanvasLib.GlobalFonts.loadFontsFromDir) {
        const fontDirs = [];
        if (process.platform === "win32" && process.env.WINDIR) {
          fontDirs.push(path.join(process.env.WINDIR, "Fonts"));
        } else if (process.platform === "linux") {
          fontDirs.push("/usr/share/fonts", "/usr/local/share/fonts");
        } else if (process.platform === "darwin") {
          fontDirs.push("/System/Library/Fonts", "/Library/Fonts");
        }
        for (const d of fontDirs) {
          try { CanvasLib.GlobalFonts.loadFontsFromDir(d); } catch {}
        }
      }
    } catch {}

    const background = await CanvasLib.loadImage(
      path.join(__dirname, "../../imgs/background.png")
    );
    ctx.strokeStyle = "#74037b";

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    const applyText = (cnv, text) => {
      const context = cnv.getContext("2d");

      // Declare a base size of the font
      let fontSize = 70;
      const minSize = 16;

      do {
        // Assign the font to the context and decrement it so it can be measured again
        context.font = `${(fontSize -= 10)}px Arial, Helvetica, sans-serif`;
        // Compare pixel width of the text to the canvas minus the approximate avatar size
      } while (fontSize > minSize && context.measureText(text).width > cnv.width - 300);

      // Return the result to use in the actual canvas
      return context.font;
    };

    ctx.font = applyText(canvas, interaction.user.username || "Użytkownik");
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
    const avatar = await CanvasLib.loadImage(await body.arrayBuffer());

    // If you don't care about the performance of HTTP requests, you can instead load the avatar using
    // const avatar = await Canvas.loadImage(interaction.user.displayAvatarURL({ extension: 'jpg' }));

    // Draw a shape onto the main canvas
    ctx.beginPath();
    ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(avatar, 25, 25, 200, 200);

    let pngBuffer;
    if (typeof canvas.encode === "function") {
      // @napi-rs/canvas
      pngBuffer = await canvas.encode("png");
    } else if (typeof canvas.toBuffer === "function") {
      // node-canvas
      pngBuffer = canvas.toBuffer("image/png");
    }

    const attachment = new AttachmentBuilder(pngBuffer, { name: "level-card.png" });
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
