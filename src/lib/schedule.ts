import type { ScheduleSpace } from '@supersetkai/kai.js';

export class ScheduleParser {
    public constructor() {};

    /**
     * Получение недельного расписания в виде массива с филдами для MessageEmbed
     * @param schedule Форматированное расписание kai.js (schedule.getSchedule(group))
     * @param scheduleWeekType Тип недели (чет/неч)
     * @example
     * const formatted = await schedule.getSchedule(group);
     * const fields = schedule.scheduleParseWeekAsField(formatted, 'чет');
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

    /**
     * Получение расписания на день в виде массива с филдами для MessageEmbed
     * @param schedule Форматированное расписание kai.js (schedule.getSchedule(group))
     * @param dayOfTheWeek День недели в виде числа (1 - понедельник, 2 - вторник, ...)
     * @example
     * const formatted = await schedule.getSchedule(group);
     * const fields = schedule.scheduleParseWeekAsField(formatted, 'чет');
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
        // День недели (положение в массиве расписания см. строка 10 файла ниже)
        // /node_modules/@supersetkai/kai.js/Source/Methods/Schedule/Formatted/GetSchedule.js
        const day = schedule[dayOfTheWeek - 1];

        let weekType = this.weekType();
        
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
}