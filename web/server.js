const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const Settings = require("../Schemas/settings");

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

  api.get("/me", ensureApiAuth, (req, res) => {
    res.json({
      user: req.user,
    });
  });

  api.get("/guilds", ensureApiAuth, (req, res) => {
    const managed = getManagedGuilds(req.user).map((g) => ({ id: g.id, name: g.name, icon: g.icon }));
    res.json({ guilds: managed });
  });

  api.get("/guilds/:id/settings", ensureApiAuth, async (req, res) => {
    const guildId = req.params.id;
    const settings = (await Settings.findOne({ guildID: guildId }).lean()) || {
      guildID: guildId,
      xpRate: 1,
      roleRewards: [],
      blacklist: { channels: [], users: [], roles: [] },
    };
    res.json({ settings });
  });

  api.put("/guilds/:id/settings", ensureApiAuth, async (req, res) => {
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
