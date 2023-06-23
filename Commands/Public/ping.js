const { ChatInputCommandInteraction, SlashCommandBuilder, Client } = require("discord.js")
module.exports = {
    data:new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Zwraca nam pong"),
     /**
      * 
      * @param {ChatInputCommandInteraction} interaction
      * @param {Client} client 
      */

    async execute(interacton,client){
        await interacton.deferReply()

        const reply = await interacton.fetchReply()


        const ping = reply.createdTimestamp-interacton.createdTimestamp

    interacton.editReply({content:`🏓latency: Client: ${ping}ms | Websocket ${client.ws.ping}`,ephemeral:true});
    }
}