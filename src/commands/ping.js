const { Client, Message, EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    name: "ping",
    description: "Получение пинга у бота",
    usage: "ping",
    example: "ping",
    requiredPermissions: [],
    checks: [],
    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {Array} args 
     */
    run: async (client, message, args) => {
        const embed = new EmbedBuilder()
            .setTitle(`Пинг ${client.user.username}`)
            .setDescription(`Задержка АПИ: ${client.ws.ping}мс`)
            .setColor(Colors.Blue)
            .setTimestamp()
        message.reply({ embeds: [embed] });
    },
}