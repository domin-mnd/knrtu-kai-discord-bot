const { Client, Message, EmbedBuilder, Colors } = require("discord.js");

module.exports = {
    name: "help",
    description: "Помощь по всем командам или по определённой команде",
    usage: "help <команда/сабкоманда> <команда>",
    requiredPermissions: [],
    checks: [],
    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {Array} args 
     */
    run: async (client, message, args) => {
        const command = args[0];
        const subcommand = args?.[1];

        if (!command) {

            const embed = new EmbedBuilder()
                .setTitle("Все команды")
                .setColor(Colors.Blurple)

            for (const key of client.commands.keys()) {
                const cmd = client.commands.get(key);
                let ad = ""
                if (!cmd.name) {
                    for (const subcmd of cmd) {
                        ad += `${subcmd.name},`
                    }

                    embed.addFields({ name: `Категория: ${key}`, value: `\`${ad.slice(0, -1)}\`` })
                } else {
                    const normalCmds = embed.data.fields.find(f => f.name === `Простые команды`);

                    if (normalCmds) {
                        embed.data.fields.splice(embed.data.fields.indexOf(normalCmds), 1)
                    } else {
                        embed.addFields({ name: `Простые команды`, value: `\`${cmd.name}\`` })
                        continue;
                    }

                    embed.addFields({ name: "Простые команды", value: normalCmds.value + `, \`${cmd.name}\`` })
                }
            }

            message.reply({
                embeds: [embed]
            })
        }

        if (!subcommand && command) {
            const cmd = client.commands.get(command);

            if (!cmd) {
                message.reply("Данная команда/группа сабкоманд не существует.");
                return;
            }

            if (!cmd?.length) {
                const embed = new EmbedBuilder()
                    .setTitle(`Инфо по ${cmd.name}`)
                    .addFields(
                        { name: "Описание", value: cmd.description?.toString() ?? "Описание отсутствует" },
                        { name: "Использование", value: cmd.usage?.toString() ?? "Шаблона нет" },
                        { name: "Пример", value: cmd.example?.toString() ?? "Примера нет" }
                    )
                    .setColor(Colors.Blue)
                    .setTimestamp()

                message.reply({ embeds: [embed] });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`Команды из сабгруппы ${command}`)
                .setColor(Colors.Blue)
                .setTimestamp()

            for (const comd of cmd) {
                embed.addFields({ name: comd.name, value: comd.description?.toString() ?? "Описание отсутствует" });
            }


            message.reply({ embeds: [embed] });
        }

        if (subcommand) {
            for (const cmd of client.commands.get(command)) {
                if (cmd.name !== subcommand) continue;

                const embed = new EmbedBuilder()
                    .setTitle(`Инфо по ${cmd.name}`)
                    .addFields(
                        { name: "Описание", value: cmd.description?.toString() ?? "Описание отсутствует" },
                        { name: "Использование", value: cmd.usage?.toString() ?? "Шаблона нет" },
                        { name: "Пример", value: cmd.example?.toString() ?? "Примера нет" }
                    )
                    .setColor(Colors.Blue)
                    .setTimestamp()

                message.reply({ embeds: [embed] });
                return;
            }

            message.reply("Данная сабкоманда отсутствует.");
        }
    },
}