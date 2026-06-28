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

    // ✅ FIX 1: Ładuj font zbundlowany z projektem zamiast szukać systemowych
    // Wrzuć plik Roboto-Regular.ttf do folderu imgs/fonts/
    // Pobierz z: https://fonts.google.com/specimen/Roboto
    const FONT_NAME = "Roboto";
    try {
      if (CanvasLib.GlobalFonts) {
        CanvasLib.GlobalFonts.registerFromPath(
          path.join(__dirname, "../../imgs/fonts/Roboto-Regular.ttf"),
          FONT_NAME
        );
      } else if (CanvasLib.registerFont) {
        // node-canvas fallback
        CanvasLib.registerFont(
          path.join(__dirname, "../../imgs/fonts/Roboto-Regular.ttf"),
          { family: FONT_NAME }
        );
      }
    } catch (e) {
      console.warn("[level] Nie udało się załadować fonta:", e.message);
    }

    const background = await CanvasLib.loadImage(
      path.join(__dirname, "../../imgs/background.png")
    );

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    const applyText = (cnv, text) => {
      const context = cnv.getContext("2d");
      let fontSize = 70;
      const minSize = 16;
      do {
        context.font = `${(fontSize -= 10)}px ${FONT_NAME}`;
      } while (fontSize > minSize && context.measureText(text).width > cnv.width - 300);
      return context.font;
    };

    // Tekst - username
    ctx.font = applyText(canvas, interaction.user.username || "Użytkownik");
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      interaction.user.username,
      canvas.width / 2.5,
      canvas.height / 3.5
    );

    // Tekst - poziom
    ctx.fillText(
      `Poziom: ${userLevel.level}`,
      canvas.width / 1.95,
      canvas.height / 1.7
    );

    // Tekst - XP
    ctx.font = `28px ${FONT_NAME}`;
    ctx.fillText(
      `XP: ${userLevel.xp}/${calculateXpLevel(userLevel.level + 1)}`,
      canvas.width / 1.8,
      canvas.height / 1.2
    );

    // Avatar
    const { body } = await request(
      interaction.user.displayAvatarURL({ extension: "jpg" })
    );
    const avatar = await CanvasLib.loadImage(await body.arrayBuffer());

    // ✅ FIX 2: save/restore żeby clip() nie rozlewał się na resztę kontekstu
    ctx.save();
    ctx.beginPath();
    ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 25, 25, 200, 200);
    ctx.restore();

    // Encode do PNG
    let pngBuffer;
    if (typeof canvas.encode === "function") {
      // @napi-rs/canvas
      pngBuffer = await canvas.encode("png");
    } else if (typeof canvas.toBuffer === "function") {
      // node-canvas
      pngBuffer = canvas.toBuffer("image/png");
    }

    const attachment = new AttachmentBuilder(pngBuffer, { name: "level-card.png" });
    interaction.reply({ files: [attachment] });
  },
};