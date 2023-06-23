const { ChatInputCommandInteraction } = require("discord.js")
module.exports = {
    name: "interactionCreate",
    /**
     * 
     * @param {ChatInputCommandInteraction} interaction  
     * 
     */
    execute(interaction,client){
        if(!interaction.isChatInputCommand())return;

        const command = client.commands.get(interaction.commandName)
        if(!command) return interaction.reply({
            content: "This  command is outdated",
            ephemeral:true
        })
        if(command.developer && interaction.user.id !=="465932200123301928")
        return interaction({
            content:"Ta Komenda jest dostępna wyłącznie dla twórcy bota"
        })
        command.execute(interaction,client)
    }
}