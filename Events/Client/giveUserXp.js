function getRandomXp(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
const Level = require("../../Schemas/level");
const Settings = require("../../Schemas/settings");
const calculateXpLevel = require("../../Function/calculateXpLevel");
const { prefix } = require("../../configs/config");

// Simple per-user cooldown (per guild) to reduce spam farming
const xpCooldown = new Map(); // key: `${guildId}:${userId}` -> timestamp(ms) when cooldown ends
const COOLDOWN_MS = 60 * 1000; // 60s

// Simple guild settings cache (TTL ~60s)
const settingsCache = new Map(); // guildId -> { data, expires }
const SETTINGS_TTL = 60 * 1000;

async function getGuildSettings(guildId) {
  const cached = settingsCache.get(guildId);
  const now = Date.now();
  if (cached && cached.expires > now) return cached.data;
  const data = (await Settings.findOne({ guildID: guildId }).lean()) || {
    guildID: guildId,
    xpRate: 1,
    roleRewards: [],
    blacklist: { channels: [], users: [], roles: [] },
  };
  settingsCache.set(guildId, { data, expires: now + SETTINGS_TTL });
  return data;
}

module.exports = {
  name: "GiveUserXP",
  event: "messageCreate",
  execute: async (message, client) => {
    // console.log("cos");
    if (!message.inGuild() || message.author.bot) {
      return;
    }
    // Ignore commands and very short/empty messages
    if (
      (typeof message.content === "string" &&
        (message.content.trim().length < 3 ||
          (prefix && message.content.startsWith(prefix)))) ||
      (!message.content && message.attachments.size === 0)
    ) {
      return;
    }

    // Check cooldown
    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    const until = xpCooldown.get(key) || 0;
    if (until > now) {
      return; // still on cooldown
    }
    xpCooldown.set(key, now + COOLDOWN_MS);

    // Load guild settings
    const settings = await getGuildSettings(message.guild.id);

    // Blacklist checks
    if (settings?.blacklist) {
      const bl = settings.blacklist;
      if (Array.isArray(bl.channels) && bl.channels.includes(message.channel.id)) return;
      if (Array.isArray(bl.users) && bl.users.includes(message.author.id)) return;
      if (
        Array.isArray(bl.roles) &&
        message.member &&
        message.member.roles.cache.some((r) => bl.roles.includes(r.id))
      )
        return;
    }

    // XP with rate multiplier
    const baseXp = getRandomXp(5, 25);
    const rate = Math.max(0, Number(settings?.xpRate) || 1);
    const xpToGive = Math.floor(baseXp * rate);
    const query = { guildID: message.guild.id, userID: message.author.id };
    try {
      const levelDoc = await Level.findOne(query);
      if (levelDoc) {
        levelDoc.xp += xpToGive;

        // Handle level-ups with carryover XP; compare against next level threshold
        let leveledUp = false;
        while (levelDoc.xp >= calculateXpLevel(levelDoc.level + 1)) {
          levelDoc.xp -= calculateXpLevel(levelDoc.level + 1);
          levelDoc.level += 1;
          leveledUp = true;
        }

        await levelDoc.save().catch((error) =>
          console.log(`Error saving level: ${error}`)
        );

        if (leveledUp) {
          await message.channel
            .send(
              `Gratulacje ${message.author}, awansowałeś na poziom ${levelDoc.level}`
            )
            .catch(() => {});

          // Assign role rewards for reached levels
          try {
            const rewards = Array.isArray(settings?.roleRewards)
              ? settings.roleRewards.filter((r) => Number(r.level) <= levelDoc.level)
              : [];
            if (rewards.length && message.member && message.guild) {
              for (const rw of rewards) {
                const role = message.guild.roles.cache.get(String(rw.roleId));
                if (role && !message.member.roles.cache.has(role.id)) {
                  await message.member.roles.add(role).catch(() => {});
                }
              }
            }
          } catch (_) {}
        }
      } else {
        // Create a new document and check for immediate level-up
        let startingXp = xpToGive;
        let startingLevel = 0;
        while (startingXp >= calculateXpLevel(startingLevel + 1)) {
          startingXp -= calculateXpLevel(startingLevel + 1);
          startingLevel += 1;
        }

        const newLevel = new Level({
          guildID: message.guild.id,
          userID: message.author.id,
          xp: startingXp,
          level: startingLevel,
        });
        await newLevel
          .save()
          .catch((error) => console.log(`Error saving new level: ${error}`));

        if (startingLevel > 0) {
          await message.channel
            .send(
              `Gratulacje ${message.author}, awansowałeś na poziom ${startingLevel}`
            )
            .catch(() => {});

          // Initial role rewards (unlikely but for completeness)
          try {
            const rewards = Array.isArray(settings?.roleRewards)
              ? settings.roleRewards.filter((r) => Number(r.level) <= startingLevel)
              : [];
            if (rewards.length && message.member && message.guild) {
              for (const rw of rewards) {
                const role = message.guild.roles.cache.get(String(rw.roleId));
                if (role && !message.member.roles.cache.has(role.id)) {
                  await message.member.roles.add(role).catch(() => {});
                }
              }
            }
          } catch (_) {}
        }
      }
    } catch (error) {
      console.log(`Error giving user xp: ${error}`);
    }
  },
};
