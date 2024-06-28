const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  ActivityType,
} = require("discord.js");
const { Guilds, GuildMembers, GuildMessages } = GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember } = Partials;
const client = new Client({
  intents: [Guilds, GuildMembers, GuildMessages],
  partials: [User, Message, GuildMember, ThreadMember],
});
const { loadCommands } = require("./handlers/commandHandler");
const { loadEvents } = require("./handlers/eventHandler");
client.config = require("./configs/config.js");
client.events = new Collection();
client.commands = new Collection();
client.devCommands = new Collection();
// console.log(client.commands);
// const { connect } = require("mongoose");
// connect(client.config.DatabaseURL, {}).then(() =>
//   console.log("Klient połączony z bazą danych MongoDB")
// );

client.on("ready", (message) => {
  loadCommands(client);
  loadEvents(client);
  console.log(client.commands);

  // console.log(client.devCommands);
  client.user.setStatus("dnd");
  client.user.setActivity("Użyj /help", {
    type: ActivityType.LISTENING,
  });
});
client.login(client.config.token);
