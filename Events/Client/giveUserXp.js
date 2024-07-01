function getRandomXp(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
const Level = require("../../Schemas/level");
const calculateXpLevel = require("../../Function/calculateXpLevel");

module.exports = {
  name: "GiveUserXP",
  event: "messageCreate",
  execute: async (message, client) => {
    // console.log("cos");
    if (!message.inGuild() || message.author.bot) {
      return;
    }
    const xpToGive = getRandomXp(5, 25);
    const query = { guildID: message.guild.id, userID: message.author.id };
    try {
      const level = await Level.findOne(query);
      if (level) {
        level.xp += xpToGive;

        if (level.xp > calculateXpLevel(level.level)) {
          level.xp = 0;
          level.level += 1;
          message.channel.send(
            `Gratulacje ${message.author}, awansowałeś na poziom ${level.level}`
          );
        }
        await level
          .save()
          .catch((error) => console.log(`Error saving level: ${error}`));
      } else {
        const newLevel = new Level({
          guildID: message.guild.id,
          userID: message.author.id,
          xp: xpToGive,
          level: 0,
        });
        await newLevel
          .save()
          .catch((error) => console.log(`Error saving new level: ${error}`));
      }
    } catch (error) {
      console.log(`Error giving user xp: ${error}`);
    }
  },
};
