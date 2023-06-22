const { loadCommands } = require("../../handlers/commandHandler")
const {Client, ActivityType} = require("discord.js")
const client = Client;
module.exports = {
    name:"ready",
    once:true,
    execute(client) {
        
        console.log("Klient jest gotowy!")
        loadCommands(client)
    }
}