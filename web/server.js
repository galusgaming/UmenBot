const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const {
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const Settings = require("../Schemas/settings");
const TicketSettings = require("../Schemas/Ticket");
const Level = require("../Schemas/level");

function initWeb(client) {
  const app = express();

  // Settings
  const PORT = process.env.PANEL_PORT || 3000;
  const SESSION_SECRET = process.env.SESSION_SECRET || "change-me";
  const CALLBACK_URL = process.env.DISCORD_CALLBACK_URL || "http://localhost:" + PORT + "/auth/callback";

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // Sessions in MongoDB (reuse existing Mongoose connection via URL)
  const mongoUrl = client?.config?.DatabaseURL || process.env.MONGODB_URI || process.env.MONGODB_URL;
  app.use(
    session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 7 days
      store: mongoUrl
        ? MongoStore.create({ mongoUrl })
        : undefined,
    })
  );

  // Passport setup
  const scopes = ["identify", "guilds"];
  passport.use(
    new DiscordStrategy(
      {
        clientID: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        callbackURL: CALLBACK_URL,
        scope: scopes,
      },
      (accessToken, refreshToken, profile, done) => {
        // We only need basic profile + guilds
        const user = {
          id: profile.id,
          username: profile.username,
          discriminator: profile.discriminator,
          avatar: profile.avatar,
          guilds: profile.guilds || [],
        };
        return done(null, user);
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  app.use(passport.initialize());
  app.use(passport.session());

  // Helpers
  function ensureAuth(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) return next();
    return res.redirect("/login");
  }
  function ensureApiAuth(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) return next();
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  function getManagedGuilds(user) {
    // Show only guilds where the bot is present
    const botGuildIds = new Set(client.guilds.cache.map((g) => g.id));
    return (user.guilds || []).filter((g) => botGuildIds.has(g.id));
  }

  const MANAGE_GUILD_BIT = 0x20n;
  // Verifies the logged-in user actually owns/manages this specific guild
  // (not just "is logged in"), and that the bot is present there.
  function requireGuildAccess(req, res, next) {
    const guildId = req.params.id;
    if (!client.guilds.cache.has(guildId)) {
      return res.status(404).json({ ok: false, error: "bot_not_in_guild" });
    }
    const membership = (req.user?.guilds || []).find((g) => g.id === guildId);
    if (!membership) {
      return res.status(403).json({ ok: false, error: "not_a_member" });
    }
    let canManage = !!membership.owner;
    try {
      canManage = canManage || (BigInt(membership.permissions || 0) & MANAGE_GUILD_BIT) === MANAGE_GUILD_BIT;
    } catch (_) {
      // ignore malformed permissions value
    }
    if (!canManage) {
      return res.status(403).json({ ok: false, error: "insufficient_permissions" });
    }
    return next();
  }

  // Routes: auth
  app.get("/login", passport.authenticate("discord"));
  app.get(
    "/auth/callback",
    passport.authenticate("discord", { failureRedirect: "/" }),
    (req, res) => {
      res.redirect("/panel");
    }
  );
  app.get("/logout", (req, res, next) => {
    req.logout(function () {
      req.session?.destroy(() => res.redirect("/"));
    });
  });

  // API (SPA)
  const api = express.Router();

  // Public info for the landing page — no auth required, no sensitive data.
  const INVITE_PERMISSIONS = "1099780090886"; // view/send/embed, manage messages, kick, ban, manage roles, timeout
  api.get("/public-info", (req, res) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    res.json({
      guildCount: client.guilds.cache.size,
      version: require("../package.json").version,
      inviteUrl: clientId
        ? `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${INVITE_PERMISSIONS}&scope=bot%20applications.commands`
        : null,
    });
  });

  api.get("/me", ensureApiAuth, (req, res) => {
    res.json({
      user: req.user,
    });
  });

  api.get("/guilds", ensureApiAuth, (req, res) => {
    const managed = getManagedGuilds(req.user).map((g) => ({ id: g.id, name: g.name, icon: g.icon }));
    res.json({ guilds: managed });
  });

  api.get("/guilds/:id/settings", ensureApiAuth, requireGuildAccess, async (req, res) => {
    const guildId = req.params.id;
    const settings = (await Settings.findOne({ guildID: guildId }).lean()) || {
      guildID: guildId,
      xpRate: 1,
      roleRewards: [],
      blacklist: { channels: [], users: [], roles: [] },
    };
    res.json({ settings });
  });

  api.put("/guilds/:id/settings", ensureApiAuth, requireGuildAccess, async (req, res) => {
    const guildId = req.params.id;
    const body = req.body || {};

    const xpRate = Math.max(0, Number(body.xpRate) || 1);
    const roleRewards = Array.isArray(body.roleRewards) ? body.roleRewards : [];
    const blacklist = {
      channels: Array.isArray(body.blacklist?.channels) ? body.blacklist.channels : [],
      users: Array.isArray(body.blacklist?.users) ? body.blacklist.users : [],
      roles: Array.isArray(body.blacklist?.roles) ? body.blacklist.roles : [],
    };

    const update = {
      guildID: guildId,
      xpRate,
      roleRewards: roleRewards
        .map((r) => ({ level: Math.max(0, Number(r.level) || 0), roleId: String(r.roleId || "").trim() }))
        .filter((r) => r.roleId),
      blacklist,
      updatedBy: req.user?.id,
      updatedAt: new Date(),
    };
    try {
      await Settings.findOneAndUpdate({ guildID: guildId }, update, { upsert: true });
      res.json({ ok: true });
    } catch (err) {
      console.error("Error saving settings", err);
      res.status(500).json({ ok: false, error: "save_failed" });
    }
  });

  // Roles/channels for pickers in the panel (ticket settings, role rewards, blacklists)
  api.get("/guilds/:id/roles", ensureApiAuth, requireGuildAccess, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.id);
    const roles = guild.roles.cache
      .filter((r) => r.id !== guild.id && !r.managed)
      .sort((a, b) => b.position - a.position)
      .map((r) => ({ id: r.id, name: r.name, color: r.hexColor }));
    res.json({ roles });
  });

  api.get("/guilds/:id/channels", ensureApiAuth, requireGuildAccess, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.id);
    const textChannels = guild.channels.cache
      .filter((c) => c.type === ChannelType.GuildText)
      .map((c) => ({ id: c.id, name: c.name }));
    const categories = guild.channels.cache
      .filter((c) => c.type === ChannelType.GuildCategory)
      .map((c) => ({ id: c.id, name: c.name }));
    res.json({ textChannels, categories });
  });

  // Ticket system settings — mirrors /setup-ticket
  api.get("/guilds/:id/ticket-settings", ensureApiAuth, requireGuildAccess, async (req, res) => {
    const guildId = req.params.id;
    const settings = (await TicketSettings.findOne({ guildID: guildId }).lean()) || {
      guildID: guildId,
      staffRoleID: null,
      logsChannelID: null,
      categoryID: null,
      ticketCount: 0,
    };
    res.json({ settings });
  });

  api.put("/guilds/:id/ticket-settings", ensureApiAuth, requireGuildAccess, async (req, res) => {
    const guildId = req.params.id;
    const body = req.body || {};
    const update = {
      guildID: guildId,
      staffRoleID: body.staffRoleID ? String(body.staffRoleID) : null,
      logsChannelID: body.logsChannelID ? String(body.logsChannelID) : null,
      categoryID: body.categoryID ? String(body.categoryID) : null,
    };
    try {
      await TicketSettings.findOneAndUpdate({ guildID: guildId }, update, { upsert: true });
      res.json({ ok: true });
    } catch (err) {
      console.error("Error saving ticket settings", err);
      res.status(500).json({ ok: false, error: "save_failed" });
    }
  });

  // Posts the "open a ticket" panel (embed + button) to a chosen channel —
  // same output as running /setup-ticket, but from the web panel.
  api.post("/guilds/:id/ticket-panel", ensureApiAuth, requireGuildAccess, async (req, res) => {
    const guildId = req.params.id;
    const { channelId } = req.body || {};
    const guild = client.guilds.cache.get(guildId);
    const settings = await TicketSettings.findOne({ guildID: guildId }).lean();
    if (!settings?.staffRoleID || !settings?.logsChannelID) {
      return res.status(400).json({ ok: false, error: "not_configured" });
    }
    const channel = guild?.channels.cache.get(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      return res.status(400).json({ ok: false, error: "invalid_channel" });
    }
    try {
      const embed = new EmbedBuilder()
        .setTitle("🎫 Wsparcie — Otwórz Ticket")
        .setDescription(
          "Masz problem, pytanie lub chcesz skontaktować się z obsługą?\n" +
          "Kliknij przycisk poniżej, aby otworzyć prywatny ticket.\n\n" +
          "> 📌 Opisz dokładnie swój problem po otwarciu ticketu.\n" +
          "> ⏱️ Nasz zespół odpowie jak najszybciej."
        )
        .setColor(0x5865f2)
        .setFooter({ text: guild.name, iconURL: guild.iconURL() })
        .setTimestamp();
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_create")
          .setLabel("📩 Utwórz ticket")
          .setStyle(ButtonStyle.Primary)
      );
      await channel.send({ embeds: [embed], components: [row] });
      res.json({ ok: true });
    } catch (err) {
      console.error("Error sending ticket panel", err);
      res.status(500).json({ ok: false, error: "send_failed" });
    }
  });

  // Read-only leaderboard viewer — same query as /leaderboard
  api.get("/guilds/:id/leaderboard", ensureApiAuth, requireGuildAccess, async (req, res) => {
    const guildId = req.params.id;
    const guild = client.guilds.cache.get(guildId);
    const top = await Level.find({ guildID: guildId })
      .sort({ level: -1, xp: -1 })
      .limit(10)
      .lean();
    const entries = await Promise.all(
      top.map(async (doc, i) => {
        let username = doc.userID;
        let avatar = null;
        try {
          const member = await guild.members.fetch(String(doc.userID)).catch(() => null);
          if (member?.user) {
            username = `${member.user.username}`;
            avatar = member.user.displayAvatarURL({ size: 64 });
          }
        } catch (_) {}
        return { rank: i + 1, userID: doc.userID, username, avatar, level: doc.level, xp: doc.xp };
      })
    );
    res.json({ entries });
  });

  app.use("/api", api);

  // Static frontend (Vite React build)
  const distPath = path.join(__dirname, "client", "dist");
  const indexHtml = path.join(distPath, "index.html");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
  }

  // Fallback to index.html for SPA routes (except API and auth)
  app.get(/^(?!\/api|\/login|\/logout|\/auth).*/, (req, res) => {
    if (fs.existsSync(indexHtml)) return res.sendFile(indexHtml);
    // If not built yet, show minimal message
    res.status(200).send("<h1>UmenBot Panel</h1><p>Zbuduj frontend (web/client) i odśwież.</p>");
  });

  app.listen(PORT, () => {
    console.log(chalk.cyan(`Web panel listening on http://localhost:${PORT}`));
  });

  return app;
}

module.exports = { initWeb };
