const { Client, Message, EmbedBuilder, Colors } = require("discord.js");
const config = require("../../config.json");


module.exports = {
    name: "punish",
    description: "Отправить пользователя в колонию",
    usage: "punish <@пользователь>",
    example: "punish @Wumpus#0000",
    requiredPermissions: [],
    checks: [{
        check: (message) => message.member.roles.cache.has(config.discord.roles.staff),
        error: "У вас нет прав для использования этой команды."
    }, {
        check: (message, args) => args?.[0] !== undefined,
        error: "Выделите пользователя или вставьте его ID."
    }],
    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {Array} args 
     */
    run: async (client, message, args) => {

        const user = message.mentions.members.first() || message.guild.members.cache.get(args[0])

        if (!user) return message.reply("Выделите пользователя.");

        if (user.roles.cache.has(config.discord.roles.staff)) {
            return message.reply("Вы не можете отправить модерацию в колонию!");
        }

        if (user.user.id == message.author.id) {
            return message.reply("Вы не можете отправить самого себя в колонию!");
        }

        user.roles.add(config.discord.roles.prisoner).catch(err => {
            console.error(err);
            return message.reply("Я не смог отправить данного пользователя в колонию, к сожалению.");
        });

        message.reply(`${user.user.username} был отправлен в колонию модератором ${message.author.tag}!`);
    },
}