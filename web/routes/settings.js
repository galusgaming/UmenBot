const express = require("express");
const { PermissionsBitField } = require("discord.js");
const Settings = require("../../Schemas/settings");

module.exports = function (client) {
  const router = express.Router();

  async function requireManageGuild(req, res, next) {
    const guildId = req.params.id;
    const userId = req.user?.id;
    if (!guildId || !userId) return res.status(403).send("Forbidden");
    try {
      const guild = await client.guilds.fetch(guildId);
      const member = await guild.members.fetch(userId);
      const isOwner = guild.ownerId === userId;
      const canManage = member.permissions.has(PermissionsBitField.Flags.ManageGuild);
      if (isOwner || canManage) return next();
    } catch (e) {
      // fallthrough
    }
    return res.status(403).send("Brak uprawnień do zarządzania tą gildią");
  }

  // View settings
  router.get("/:id/settings", requireManageGuild, async (req, res) => {
    const guildId = req.params.id;
    const guild = client.guilds.cache.get(guildId);
    const settings = (await Settings.findOne({ guildID: guildId })) || new Settings({ guildID: guildId });
    res.render("settings", {
      user: req.user,
      client,
      guild,
      settings,
    });
  });

  // Update settings
  router.post("/:id/settings", requireManageGuild, async (req, res) => {
    const guildId = req.params.id;
    const {
      xpRate,
      roleLevels = [],
      roleIds = [],
      blacklistChannels = "",
      blacklistUsers = "",
      blacklistRoles = "",
    } = req.body || {};

    // Normalize role rewards from paired arrays
    const rewards = [];
    const arrLevels = Array.isArray(roleLevels) ? roleLevels : [roleLevels].filter(Boolean);
    const arrIds = Array.isArray(roleIds) ? roleIds : [roleIds].filter(Boolean);
    for (let i = 0; i < Math.min(arrLevels.length, arrIds.length); i++) {
      const lvl = parseInt(arrLevels[i], 10);
      const rid = String(arrIds[i] || "").trim();
      if (Number.isFinite(lvl) && rid) {
        rewards.push({ level: Math.max(0, lvl), roleId: rid });
      }
    }

    function splitList(val) {
      if (!val) return [];
      if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean);
      return String(val)
        .split(/[,\s]+/)
        .map((v) => v.trim())
        .filter(Boolean);
    }

    const update = {
      guildID: guildId,
      xpRate: Math.max(0, Number(xpRate) || 1),
      roleRewards: rewards,
      blacklist: {
        channels: splitList(blacklistChannels),
        users: splitList(blacklistUsers),
        roles: splitList(blacklistRoles),
      },
      updatedBy: req.user?.id,
      updatedAt: new Date(),
    };

    try {
      await Settings.findOneAndUpdate({ guildID: guildId }, update, { upsert: true });
      res.redirect(`/guilds/${guildId}/settings`);
    } catch (err) {
      console.error("Error saving settings", err);
      res.status(500).send("Błąd zapisu ustawień");
    }
  });

  return router;
};
