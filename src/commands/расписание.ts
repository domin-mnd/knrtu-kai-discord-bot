import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';

import { Schedule, ScheduleInterface } from '@supersetkai/kai.js';
const schedule: ScheduleInterface = new Schedule();

@ApplyOptions<Command.Options>({
	description: 'Показывает расписание студента КАИ'
})
export class UserCommand extends Command {

	// Регистрация аппликэйшен команды
	public override registerApplicationCommands(registry: Command.Registry) {

		// Регистрация слэш команды
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
            options: [
                {
                    name: 'группа',
                    description: 'Номер группы',
                    type: 'NUMBER',
                    required: true
                },
                {
                    name: 'день',
                    description: 'День недели',
                    type: 'STRING',
                    required: true,
                    choices: [
                        { name: 'На сегодня', value: 'На сегодня' },
                        { name: 'На завтра', value: 'На завтра' },
                        { name: 'На неделю', value: 'На неделю' },
                        { name: 'На следующую неделю', value: 'На следующую неделю' }
                    ]
                }
            ]
		});
	}

	// Слэш команда
	public async chatInputRun(interaction: Command.ChatInputInteraction) {
		const group: number = interaction.options.getNumber('группа', true);
		const day: string = interaction.options.getString('день', true);

        await interaction.reply({
            content: `Получаю расписание по номеру группы: "${group}"...`,
            fetchReply: true
        });

        // Получение расписания с помощью библиотеки @supersetkai/kai.js
        // https://github.com/supersetkai/kai.js
        // https://www.npmjs.com/package/@supersetkai/kai.js
        // schedule - класс расписания (см. строка 5)
        const raw = await schedule.getSchedule(group);

		await interaction.editReply({
			content: `Форматирую расписание...`
		});

        let dayOfTheWeek: number = 0;
        let scheduleWeekType: string = this.scheduleWeekType();
        let formatted: any;
        switch (day) {
            case 'На сегодня':
                dayOfTheWeek = new Date().getDay();
                formatted = this.scheduleParseDayAsField(raw, dayOfTheWeek);
                break;
            case 'На завтра':
                dayOfTheWeek = new Date().getDay() + 1;
                if (dayOfTheWeek > 6) dayOfTheWeek = 1;
                formatted = this.scheduleParseDayAsField(raw, dayOfTheWeek);
                console.log(formatted);
                break;
            case 'На неделю':
                formatted = this.scheduleParseWeekAsField(raw, scheduleWeekType);
                break;
            case 'На следующую неделю':
                scheduleWeekType = this.scheduleWeekType() === 'чет' ? 'неч' : 'чет'
                formatted = this.scheduleParseWeekAsField(raw, scheduleWeekType);
                break;
        }

        if (formatted?.error) {
            await interaction.editReply({
                content: `При поиске расписания произошла ошибка: ${formatted.error.russian}`
            });
            return;
        }

        await interaction.editReply({
            content: `Отправляю расписание...`
        });

        const embed = new MessageEmbed()
            .setColor('#224C8B')
            .setTitle(`Расписание группы "${group}" ${day.toLowerCase()}`)
            .addFields(formatted)
            .setTimestamp()
            .setFooter({
                text: (scheduleWeekType === 'чет') ? 'Четная неделя' : 'Нечетная неделя',
                iconURL: interaction.user.displayAvatarURL()
            });

        // content "** **" потому что в ином случае ошибка
        await interaction.editReply({
            content: '** **',
            embeds: [embed]
        });
	}

    private scheduleWeekType(): string {
        let date = new Date(new Date().getTime());
        date.setHours(0, 0, 0, 0);
        // Четверг этой недели решает год.
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        // 4 Января - это всегда первая неделя
        let week1 = new Date(date.getFullYear(), 0, 4);
        let weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        return (weekNumber % 2 === 0) ? 'чет' : 'неч';
    }

    private scheduleParseDayAsField(schedule: any, dayOfTheWeek: number): Array<any> {
        // День недели (положение в массиве расписания см. строка 10 файла ниже)
        // /node_modules/@supersetkai/kai.js/Source/Methods/Schedule/Formatted/GetSchedule.js
        const day = schedule[dayOfTheWeek - 1];

        // Вывод ошибки, в случае чего
        if (schedule.error) {
            return schedule;
        }

        let weekType = this.scheduleWeekType();
        
        // Если расписание не на сегодня, и день недели понедельник, то инвертируем тип недели
        if (dayOfTheWeek !== new Date().getDay() && dayOfTheWeek === 1) {
            weekType = weekType === 'чет' ? 'неч' : 'чет';
        }

        // Преобразования объекта с предметом в строку
        // Фильтрация предметов по типу недели (чет/неч)
        // Некоторые предметы могут быть в обоих типах недели
        // Есть проблема с тем, что некоторые предметы имеют тип недели не "чет"/"неч", а например "нет" (см. расписание группы 4131)
        let response = day.map((subject: any) => (weekType === subject.day.evenOdd.raw || subject.day.evenOdd.raw === '') ? [
            `> **${subject.day.time.full}** ${subject.class.name}`,
            `> ${subject.classroom.number} каб. - ${subject.building.number} зд. - ${subject.class.type}`
        ].join('\n') : undefined);

        response = response.filter((str: any) => str !== undefined);

        const weekDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

        // Вывод объекта с днём недели и расписанием
        return [{
            name: weekDays[dayOfTheWeek - 1],
            value: response.join('\n')
        }]
    }

    private scheduleParseWeekAsField(schedule: any, scheduleWeekType: string): Array<any> {

        // Вывод ошибки, в случае чего
        if (schedule.error) {
            return schedule;
        }

        let weekType: string = scheduleWeekType;
        let weekDays: string[] = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
        let temp: any[] = [];
        let response: any[] = [];

        schedule.forEach((day: any[]) => {

            // Преобразования объекта с предметом в строку
            // Фильтрация предметов по типу недели (чет/неч)
            // Некоторые предметы могут быть в обоих типах недели
            // Есть проблема с тем, что некоторые предметы имеют тип недели не "чет"/"неч", а например "нет" (см. расписание группы 4131)
            let subject = day.map((subject: any) => (weekType === subject.day.evenOdd.raw || subject.day.evenOdd.raw === '') ? [
                `> **${subject.day.time.full}** ${subject.class.name}`,
                `> ${subject.classroom.number} каб. - ${subject.building.number} зд. - ${subject.class.type}`
            ].join('\n') : undefined);

            subject = subject.filter((str: any) => str !== undefined);

            temp.push(subject.join('\n'));
            
            // Разделители после вторника и четверга, чтобы поля были в 2 ряда
            if (response.length === 2 || response.length === 5) {
                response.push({
                    name: '\u200B',
                    value: '\u200B',
                    inline: true
                });
            }

            response.push({
                name: weekDays[schedule.indexOf(day)],
                value: temp.join(''),
                inline: true
            });
            temp = [];
        });

        // Разделитель после субботы, чтобы поле с субботой не было вдали (см. строка 189)
        response.push({
            name: '\u200B',
            value: '\u200B',
            inline: true
        });

        return response;
    }
}