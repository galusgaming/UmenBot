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
      const levelDoc = await Level.findOne(query);
      if (levelDoc) {
        levelDoc.xp += xpToGive;

        // Level-up when reaching or exceeding the next level threshold
        let leveledUp = false;
        while (levelDoc.xp >= calculateXpLevel(levelDoc.level + 1)) {
          levelDoc.xp -= calculateXpLevel(levelDoc.level + 1);
          levelDoc.level += 1;
          leveledUp = true;
        }

        await levelDoc
          .save()
          .catch((error) => console.log(`Error saving level: ${error}`));

        if (leveledUp) {
          await message.channel
            .send(
              `Gratulacje ${message.author}, awansowałeś na poziom ${levelDoc.level}`
            )
            .catch(() => {});
        }
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
