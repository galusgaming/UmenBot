const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  ActivityType,
} = require("discord.js");
const { Guilds, GuildMembers, GuildMessages, MessageContent, DirectMessages } =
  GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember } = Partials;
const client = new Client({
  intents: [
    Guilds,
    GuildMembers,
    GuildMessages,
    MessageContent,
    DirectMessages,
  ],
  partials: [User, Message, GuildMember, ThreadMember],
});
const { loadEvents } = require("./handlers/eventHandler");
const { loadCommands } = require("./handlers/commandHandler");
const mongoose = require("mongoose");
const chalk = require("chalk");
client.config = require("./configs/config.js");
client.events = new Collection();
client.commands = new Collection();

// console.log(client.commands);
// const { connect } = require("mongoose");
// connect(client.config.DatabaseURL, {}).then(() =>
//   console.log("Klient połączony z bazą danych MongoDB")
// );
(async () => {
  try {
    const dbUrl = client.config.DatabaseURL || process.env.MONGODB_URI || process.env.MONGODB_URL;
    await mongoose.connect(dbUrl, {});
    console.log(chalk.green("Połączono z bazą danych MongoDB"));

    loadEvents(client);
  } catch (error) {
    console.log(chalk.red("Nie udało się połączyć z bazą danych MongoDB"));
  }
})();

client.login(client.config.token);
