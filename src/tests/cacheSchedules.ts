// Модуль для получения форматированного расписания
import { Schedule, ScheduleInterface, ScheduleSpace } from '@supersetkai/kai.js';
const schedule: ScheduleInterface = new Schedule();

// Класс с базой данных суперсет для расписания
import { Database } from '../lib/database';
const db = new Database();

let failedGroups: any[] = [];

function save(value: String, index: number, groupNames: String[]) {
    setTimeout(async () => {
        const groupName = parseInt(value as string);
        const sched = await schedule.getSchedule(groupName);
        if (sched.error) {
            console.error(`Сохранение расписания для группы ${groupName} не удалось`);
            failedGroups.push(groupName);
        } else {
            await db.saveSchedule(groupName, sched).catch(() => {
                console.error(`Сохранение расписания для группы ${groupName} не удалось`);
                failedGroups.push(groupName);
            });
            console.log(`Сохранено расписание для группы ${groupName}, ещё ${groupNames.length - index - 1} групп`);
        }
    }, 1000 * index);
}

async function main() {
    const groups = await schedule.getGroups();
    const groupNames = groups.map((group: ScheduleSpace.Group.Formatted) => group.group.name);

    groupNames.forEach(save);

    setTimeout(() => {
        console.log('Кэширование завершено');
        console.log('Не удалось сохранить расписание для следующих групп:');
        console.log(failedGroups);
    }, 1000 * groupNames.length + 2000);
}

main();