import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';

// Модуль для получения форматированного расписания
import { Schedule, ScheduleInterface } from '@supersetkai/kai.js';
const schedule: ScheduleInterface = new Schedule();

// Класс с базой данных суперсет для расписания
import { Database } from '../lib/database';
const db = new Database();

// Парсеры для расписания
// Превращают массив расписания в массив филдов для MessageEmbed
import { ScheduleParser } from '../lib/schedule';
const parser = new ScheduleParser();

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
        // schedule - класс расписания (см. строка 7)
        let raw = await schedule.getSchedule(group);

        if (raw.error) {
            const ruErrors = [
                'Было найдено больше/меньше 1 Айди группы из поиска!',
                'Похоже сервер не работает. Попробуйте позже.'
            ]
            if (raw.error.russian = ruErrors[0]) {
                const ids = raw.ids?.map((group: any) => `\`${group.group.name}\``).join(', ');
                const list = ids ? `Список найденных групп: ${ids}` : '';
                await interaction.editReply({
                    content: `Группы по данному запросу не найдено!\n${list}`
                });
                return;
            } else if (raw.error.russian = ruErrors[1]) {
                await interaction.editReply({
                    content: `Сервер не работает, проверяю базу данных...`
                });
                raw = await db.getSchedule(group) as any;
            } else {
                await interaction.editReply({
                    content: `При поиске расписания произошла ошибка: ${raw.error.russian}`
                });
                return;
            }
        } else {
            await interaction.editReply({
                content: `Кэширую расписание...`
            });
            await db.saveSchedule(group, raw);
        }

		await interaction.editReply({
			content: `Форматирую расписание...`
		});

        let dayOfTheWeek: number = 0;
        let scheduleWeekType: string = parser.weekType();
        let formatted: any;
        switch (day) {
            case 'На сегодня':
                dayOfTheWeek = new Date().getDay();
                formatted = parser.parseDayAsField(raw, dayOfTheWeek);
                break;
            case 'На завтра':
                dayOfTheWeek = new Date().getDay() + 1;
                if (dayOfTheWeek > 6) dayOfTheWeek = 1;
                formatted = parser.parseDayAsField(raw, dayOfTheWeek);
                break;
            case 'На неделю':
                formatted = parser.parseWeekAsField(raw, scheduleWeekType);
                break;
            case 'На следующую неделю':
                scheduleWeekType = parser.weekType() === 'чет' ? 'неч' : 'чет'
                formatted = parser.parseWeekAsField(raw, scheduleWeekType);
                break;
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
}