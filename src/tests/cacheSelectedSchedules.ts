// Модуль для промпта/ввода
import readline from 'node:readline';
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const prompt = (query: string): Promise<String> => new Promise((resolve) => rl.question(query, resolve));

// Модуль для получения форматированного расписания
import { Schedule, ScheduleInterface } from '@supersetkai/kai.js';
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
    const amountOfGroups = await prompt("Введите количество групп, которые нужно кэшировать: ");
    const groupNames: any[] = [];

    for (let i = 1; i <= parseInt(amountOfGroups as string); i++) {
        groupNames.push(await prompt(`Введите номер группы: `));
    };

    groupNames.forEach(save);

    setTimeout(() => {
        console.log('Кэширование завершено');
        console.log('Не удалось сохранить расписание для следующих групп:');
        console.log(failedGroups);
        rl.close();
    }, 1000 * groupNames.length + 2000);
}

main();

// Окончание процесса, если readline закрыт
rl.on('close', () => process.exit(0));