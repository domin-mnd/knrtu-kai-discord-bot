const { Client, Message, EmbedBuilder, Colors } = require("discord.js");
const axios = require('axios');

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function capitalizeEachWord(string) {
    let arr = string.split(' ');
    let res = []
    arr.forEach(word => {
        res.push(capitalizeFirstLetter(word));
    });
    return res.join(' ');
}

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

function getSchedule(groupId) {
    return axios({
        url: 'https://kai.ru/raspisanie',
        method: 'POST',
        followRedirect: true,
        maxRedirects: 5,
        params: {
            p_p_id: 'pubStudentSchedule_WAR_publicStudentSchedule10',
            p_p_lifecycle: 2,
            p_p_resource_id: 'schedule'
        },
        data: `groupId=${groupId}`,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0'
        }
    });
}

function getGroupId(id) {
    return axios({
        url: 'https://kai.ru/raspisanie',
        method: 'GET',
        followRedirect: true,
        maxRedirects: 5,
        params: {
            p_p_id: 'pubStudentSchedule_WAR_publicStudentSchedule10',
            p_p_lifecycle: 2,
            p_p_resource_id: 'getGroupsURL',
            query: id
        },
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0'
        }
    });
}


function parseScheduleAsField(schedule, day, opts) {
    let classes = [];

    if (day === 7) return 'Расписание отсутствует';

    // Фильтр чётной и нечётной недели
    let even = '';
    if ((day === 1 && opts.type === 'tomorrow') || opts.type === 'nextweek') {
        even = weekEven({
            type: 'short',
            invert: true
        });
    } else {
        even = weekEven({
            type: 'short',
            invert: false
        });
    }

    schedule.data[day.toString()].forEach(cl => {
        let dayDate = cl.dayDate.trimEnd();
        // Так выглядит строчка предмета в филде
        let disciplName = cl.disciplName
            .trimEnd()
            .replace('(общий курс)', '')
            .replace('(общая)', '');
        if (disciplName === 'Основы безопасности жизнедеятельности') disciplName = 'ОБЖ';
        string = `**${cl.dayTime.trimEnd()}** ${disciplName} **${cl.audNum.trimEnd()}**-${cl.disciplType.trimEnd()}
        ${capitalizeEachWord(cl.prepodName.trimEnd().toLowerCase())}`;
        if (dayDate) {
            // Не включаю день если неделя другая
            if (dayDate != even) return;
            classes.push(string);
        } else {
            classes.push(string);
        }
    });

    return classes.join('\n');
}

module.exports = {
    name: "schedule",
    description: "Расписание",
    usage: "schedule <today/tomorrow/week/nextweek> <номер группы (дефолт: 4131)>",
    example: "schedule today",
    requiredPermissions: [],
    checks: [],
    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {Array} args 
     */
    run: async (client, message, args) => {
        let when = args[0] ? args[0] : 'tomorrow';
        const id = args[1] ? args[1] : 4131;

        // Проверка правильности написания первого аргумента
        if (when == 0) when = 'today';
        if (when == 1) when = 'tomorrow';
        if (when == 2) when = 'week';
        if (when == 3) when = 'nextweek';

        const keys = ['today', 'tomorrow', 'week', 'nextweek']
        if (!keys.includes(when)) {
            message.reply('Дано неправильное значение дня недели, возможны следующие значения: `today`, `tomorrow`, `week`, `nextweek`');
            return;
        }

        let groupId, schedule;

        try {
            // Делаю пост реквест для получение id группы
            groupId = await getGroupId(id);
        } catch (err) {
            await message.reply('Неудалось установить ID номера группы, попробуйте позже!');
            return;
        }
        // Если длина массива равна нулю
        if (!groupId.data.length) {
            await message.reply(`На запрос \`${id}\` не было найдено никаких групп!`);
            return;
        } else if (groupId.data.length !== 1) {
            // Вывести список групп если массив не равен одному
            let foundGroups = [];
            groupId.data.forEach(group => {
                foundGroups.push(`\`${group.group}\``);
            });
            await message.reply(`На запрос \`${id}\` нашлись следующие группы: ${foundGroups.join(', ')}`);
            return;
        }
        // Упрощаю
        groupId = groupId.data[0].id;

        try {
            // Делаю пост реквест для получение расписания группы
            schedule = await getSchedule(groupId);
        } catch (err) {
            await message.reply('Неудалось установить расписание группы, попробуйте позже!');
            return;
        }

        if (when === 'today') {
            let day = new Date().getDay();

            // Узнаю день для названия поля
            const dayOfWeek = new Date().toLocaleString(
                'ru-RU', {weekday: 'long'}
            );

            const embed = new EmbedBuilder()
                .setTitle('Расписание на сегодня')
                .addFields({
                    name: capitalizeFirstLetter(dayOfWeek),
                    value: parseScheduleAsField(schedule, day, { type: when })
                })
                .setColor(Colors.Blue)
                .setTimestamp()
                .setFooter({
                    text: weekEven({ type: 'long'}),
                    iconURL: message.author.avatarURL()
                })

            await message.reply({ embeds: [embed] });
            return;
        } else if (when === 'tomorrow') {
            let day = new Date().getDay() + 1;
            if (day === 8 || day === 7) day = 1;

            // Узнаю завтрашний день для названия поля
            let dayOfWeek = new Date();
            if (dayOfWeek.getDay() === 6) {
                dayOfWeek.setDate(dayOfWeek.getDate() + 2);
            } else {
                dayOfWeek.setDate(dayOfWeek.getDate() + 1);
            }
            dayOfWeek = dayOfWeek.toLocaleString(
                'ru-RU', { weekday: 'long' }
            );

            // Узнаю если завтра понедельник и если да, то инвертирую значение недели
            let footer = '';
            if (day === 1) {
                footer = weekEven({ type: 'long', invert: true });
            } else {
                footer = weekEven({ type: 'long' });
            }

            const embed = new EmbedBuilder()
                .setTitle('Расписание на завтра')
                .addFields({
                    name: capitalizeFirstLetter(dayOfWeek),
                    value: parseScheduleAsField(schedule, day, { type: when })
                })
                .setColor(Colors.Blue)
                .setTimestamp()
                .setFooter({
                    text: footer,
                    iconURL: message.author.avatarURL()
                })
			if (new Date().getDay() === 6) embed.setTitle('Расписание на послезавтра');
            await message.reply({ embeds: [embed] });
            return;
        } else if (when === 'week') {
            const embed = new EmbedBuilder()
                .setTitle('Расписание на неделю')
                .addFields(
                    {
                        name: 'Понедельник',
                        value: parseScheduleAsField(schedule, 1, { type: when }),
                        inline: true
                    },
                    {
                        name: 'Вторник',
                        value: parseScheduleAsField(schedule, 2, { type: when }),
                        inline: true
                    },
                    {
                        name: '\u200B',
                        value: '\u200B',
                        inline: true
                    },
                    {
                        name: 'Среда',
                        value: parseScheduleAsField(schedule, 3, { type: when }),
                        inline: true
                    },
                    {
                        name: 'Четверг',
                        value: parseScheduleAsField(schedule, 4, { type: when }),
                        inline: true
                    },
                    {
                        name: '\u200B',
                        value: '\u200B',
                        inline: true
                    },
                    {
                        name: 'Пятница',
                        value: parseScheduleAsField(schedule, 5, { type: when }),
                        inline: true
                    },
                    {
                        name: 'Суббота',
                        value: parseScheduleAsField(schedule, 6, { type: when }),
                        inline: true
                    },
                    {
                        name: '\u200B',
                        value: '\u200B',
                        inline: true
                    }
                )
                .setColor(Colors.Blue)
                .setTimestamp()
                .setFooter({
                    text: weekEven({ type: 'long'}),
                    iconURL: message.author.avatarURL()
                })

            await message.reply({ embeds: [embed] });
            return;
        } else if (when === 'nextweek') {
            const embed = new EmbedBuilder()
                .setTitle('Расписание на следующую неделю')
                .addFields(
                    {
                        name: 'Понедельник',
                        value: parseScheduleAsField(schedule, 1, { type: when }),
                        inline: true
                    },
                    {
                        name: 'Вторник',
                        value: parseScheduleAsField(schedule, 2, { type: when }),
                        inline: true
                    },
                    {
                        name: '\u200B',
                        value: '\u200B',
                        inline: true
                    },
                    {
                        name: 'Среда',
                        value: parseScheduleAsField(schedule, 3, { type: when }),
                        inline: true
                    },
                    {
                        name: 'Четверг',
                        value: parseScheduleAsField(schedule, 4, { type: when }),
                        inline: true
                    },
                    {
                        name: '\u200B',
                        value: '\u200B',
                        inline: true
                    },
                    {
                        name: 'Пятница',
                        value: parseScheduleAsField(schedule, 5, { type: when }),
                        inline: true
                    },
                    {
                        name: 'Суббота',
                        value: parseScheduleAsField(schedule, 6, { type: when }),
                        inline: true
                    },
                    {
                        name: '\u200B',
                        value: '\u200B',
                        inline: true
                    }
                )
                .setColor(Colors.Blue)
                .setTimestamp()
                .setFooter({
                    text: weekEven({ type: 'long', invert: true }),
                    iconURL: message.author.avatarURL()
                })

            await message.reply({ embeds: [embed] });
            return;
        }
        // По-моим расчётам эта функция никогда не воспроизведётся
        // см. строка 41
        await message.reply('Дано неправильное значение дня недели, возможны следующие значения: `today`, `tomorrow`, `week`');
    },
}