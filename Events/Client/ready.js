const { loadCommands } = require("../../handlers/commandHandler");
const { Client, PresenceUpdateStatus, ActivityType } = require("discord.js");
const client = Client;
const chalk = require("chalk");
module.exports = {
  name: "ready",
  event: "ready",
  once: true,
  execute(client) {
    loadCommands(client);
    // console.log(client.commands);
    // console.log(client.devCommands);
    console.log(chalk.blue.bgRed.bold("Klient jest gotowy!"))
    client.user.setPresence({
      activities: [{ name: "/help | UmenBot", type: ActivityType.Watching }],
      status: PresenceUpdateStatus.Online,
    });
  },
};