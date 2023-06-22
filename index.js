const { Client, GatewayIntentBits, Partials, Collection, ActivityType } = require("discord.js")
const {Gulds, GuildMembers, GuildMessages }= GatewayIntentBits
const {User, Message, GuildMember, ThreadMember} = Partials
const client = new Client({
	intents:["Guilds"],
	partials:[User,Message,GuildMember,ThreadMember]
})

const {loadEvents} = require("./handlers/eventHandler")
client.config = require("./configs/config.js") 
client.events = new Collection()
client.commands = new Collection()
loadEvents(client)

client.on("ready", message=>{
	client.user.setActivity('Bot w trakcie prac serwisowych!');
})
client.login(client.config.token)
