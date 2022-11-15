import type { ScheduleSpace } from '@supersetkai/kai.js';

export class ScheduleParser {
    private weekDays: string[];

    public constructor() {
        this.weekDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    };

    /**
     * Получение недельного расписания в виде массива с филдами для MessageEmbed
     * @param schedule Форматированное расписание kai.js (schedule.getSchedule(group))
     * @param scheduleWeekType Тип недели (чет/неч)
     * @example
     * const formatted = await schedule.getSchedule(group);
     * const fields = parser.scheduleParseWeekAsField(formatted, 'чет');
     * console.log(fields);
     * // returns [
     * //  {
     * //     name: 'Понедельник',
     * //     value: '> **9:40** Русский язык\n529 каб. - 7 зд. - лек',
     * //     inline: true
     * //  },
     * //  {
     * //     name: 'Вторник',
     * //     value: '\u200B',
     * //     inline: true
     * //  },
     * //  ...
     * // ]
     * @returns Массив с расписанием
     */
     public parseWeekAsField(schedule: ScheduleSpace.Formatted, scheduleWeekType: string): Array<any> {

        let weekType: string = scheduleWeekType;
        let temp: any[] = [];
        let response: any[] = [];

        schedule.forEach((day: ScheduleSpace.Subject.Formatted[]) => {
            let subject = this.mapDay(day, weekType);

            subject = subject.filter((str: any) => str !== undefined);

            // Если предметов нет, то добавляем пустую строку
            temp.push(subject.join('\n') ? subject.join('\n') : '\u200B');
            
            // Разделители после вторника и четверга, чтобы поля были в 2 ряда
            if (response.length === 2 || response.length === 5) {
                response.push({
                    name: '\u200B',
                    value: '\u200B',
                    inline: true
                });
            }

            response.push({
                name: this.weekDays[schedule.indexOf(day)],
                value: temp.join(''),
                inline: true
            });
            temp = [];
        });

        // Разделитель после субботы, чтобы поле с субботой не было вдали
        response.push({
            name: '\u200B',
            value: '\u200B',
            inline: true
        });

        return response;
    }

    /**
     * Получение расписания на день в виде массива с филдами для MessageEmbed
     * @param schedule Форматированное расписание kai.js (schedule.getSchedule(group))
     * @param dayOfTheWeek День недели в виде числа (1 - понедельник, 2 - вторник, ...)
     * @example
     * const formatted = await schedule.getSchedule(group);
     * const fields = parser.scheduleParseWeekAsField(formatted, 'чет');
     * console.log(fields);
     * // returns [
     * //  {
     * //     name: 'Понедельник',
     * //     value: '> **9:40** Русский язык\n529 каб. - 7 зд. - лек',
     * //     inline: true
     * //  },
     * // ]
     * @returns Массив с расписанием на день
     */
    public parseDayAsField(schedule: ScheduleSpace.Formatted, dayOfTheWeek: number): Array<any> {
        // День недели (положение в массиве расписания см. на 10 строк файла ниже)
        // /node_modules/@supersetkai/kai.js/src/methods/schedule/formatted/getSchedule.js
        const day = schedule[dayOfTheWeek - 1];

        let weekType = this.weekType();
        
        // Если расписание не на сегодня, и день недели понедельник, то инвертируем тип недели
        if (dayOfTheWeek !== new Date().getDay() && dayOfTheWeek === 1) {
            weekType = this.invertWeekType(weekType);
        }

        let response = this.mapDay(day, weekType);

        response = response.filter((str: any) => str !== undefined);

        // Вывод объекта с днём недели и расписанием
        return [{
            name: this.weekDays[dayOfTheWeek - 1],
            value: response.join('\n')
        }]
    }

    /**
     * Получение типа недели на сегодня
     * @example
     * const weekType = parser.weekType();
     * console.log(weekType);
     * // returns "чет"
     * @returns "чет" или "неч"
     */
    public weekType(): string {
        let date = new Date(new Date().getTime());
        date.setHours(0, 0, 0, 0);
        
        // Четверг этой недели решает год.
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);

        // 4 Января - это всегда первая неделя
        let week1 = new Date(date.getFullYear(), 0, 4);
        let weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        return (weekNumber % 2 === 0) ? 'чет' : 'неч';
    }

    private mapDay(day: ScheduleSpace.Subject.Formatted[], weekType: string): (string | undefined)[] {

        // Преобразования объекта с предметом в строку
        // Фильтрация предметов по типу недели (чет/неч)
        // Некоторые предметы могут быть в обоих типах недели
        // См. /src/tests/data/subjectFields.json
        return day.map((subject: ScheduleSpace.Subject.Formatted) => (
            subject.day.evenOdd.raw.includes(weekType) ||
            subject.day.evenOdd.raw === '' ||
            subject.day.evenOdd.raw.includes('еженед')
        ) ? [
            `> **${subject.day.time.full}** ${subject.class.name}`,
            `> ${subject.classroom.number} каб. - ${subject.building.number} зд. - ${subject.class.type}`
        ].join('\n') : (
            !subject.day.evenOdd.raw.includes(this.invertWeekType(weekType))
        ) ? [
            `> **${subject.day.time.full}** ${subject.class.name}`,
            `> ${subject.classroom.number} каб. - ${subject.building.number} зд. - ${subject.class.type}`,
            `> __${subject.day.evenOdd.raw}__ нед.`
        ].join('\n') : undefined);
    }

    private invertWeekType(weekType: string): string {
        return weekType === 'чет' ? 'неч' : 'чет';
    }
}