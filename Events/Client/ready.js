const { loadCommands } = require("../../handlers/commandHandler");
const { Client, ActivityType, Collection } = require("discord.js");
const client = Client;
module.exports = {
  name: "ready",
  once: true,
  execute(client) {
    // // client.devCommands = new Collection();
    // client.commands = new Collection();
    // loadCommands(client);
    // console.log(client.commands);
    // console.log(client.devCommands);
    console.log("Klient jest gotowy!");
  },
};
