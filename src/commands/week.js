const { Client, Message, EmbedBuilder, Colors } = require("discord.js");

function weekNumber() {
    // Номер недели
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), 0, 1);
    const days = Math.floor(
        (currentDate - startDate) /
        (24 * 60 * 60 * 1000)
    );
    return Math.ceil(days / 7);
}

function weekEven(opts) {
    let even = '';
    let weekMod = weekNumber() % 2;
    if (opts.type === 'short') {
        even = 'чет';
        if (weekMod) even = 'неч';
        if (opts.invert) {
            if (even = 'чет') even = 'неч';
            else even = 'чет';
        }
    } else if (opts.type === 'long') {
        even = 'Чётная неделя';
        if (weekMod) even = 'Нечётная неделя';
        if (opts.invert) {
            if (even = 'Чётная неделя') even = 'Нечётная неделя';
            else even = 'Чётная неделя';
        }
    }
    return even;
}

module.exports = {
    name: "week",
    description: "Определяет чётная ли неделя или нет",
    usage: "week",
    example: "week",
    requiredPermissions: [],
    checks: [],
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {Array} args
     */
    run: async (client, message, args) => {
        const embed = new EmbedBuilder()
            .setTitle(weekEven({ type: 'long' }))
            .setColor(Colors.Blue)
            .setTimestamp()
        await message.reply({ embeds: [embed] });
    },
}