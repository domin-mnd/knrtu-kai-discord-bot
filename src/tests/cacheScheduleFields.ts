// Модуль для получения форматированного расписания
import { Schedule, ScheduleInterface, ScheduleSpace } from '@supersetkai/kai.js';
const schedule: ScheduleInterface = new Schedule();

// Класс с базой данных суперсет для расписания
import { Database } from '../lib/database';
const db = new Database();

import { writeFileSync } from 'node:fs';

let schedules: any[] = [];
let failedGroups: any[] = [];

function paste(value: String, index: number, groupNames: String[]) {
    setTimeout(async () => {
        const groupName = parseInt(value as string);
        const sched = await db.getSchedule(groupName);
        if (sched.error) {
            console.error(`Неудалось просмотреть расписание для группы ${groupName}`);
            failedGroups.push(groupName);
        } else {
            schedules = schedules.concat(sched.flat());
            console.log(`Расписание группы ${groupName} добавлено в массив, ещё ${groupNames.length - index - 1} групп`);
        }
    }, 1000 * index);
}

// Функция для выпрямления объекта расписания в один общий объект
function flattenObjectKeys(arr: any): any {
    const response: any = {
        buildings: [],
        classTypes: [],
        classrooms: [],
        dayEvenOdd: [],
        teachers: []
    };

    arr.forEach((item: any) => {
        response.buildings.push(item?.building.number);
        response.classTypes.push(item?.class.type);
        response.classrooms.push(item?.classroom.number);
        response.dayEvenOdd.push(item?.day.evenOdd.raw);
        response.teachers.push(item?.teacher.name.full);
    });

    return response;
}

function filterDuplicates(arr: any): any {
    return [ ...new Set(arr) ];
}

function filterArrays(obj: any): any {
    let response = obj;
    for (const key in obj) {
        response[key] = filterDuplicates(obj[key]);
    }
    return response;
}

async function main() {
    const groups = await schedule.getGroups();
    const groupNames = groups.map((group: ScheduleSpace.Group.Formatted) => group.group.name);

    groupNames.forEach(paste);

    setTimeout(() => {
        console.log('Неудалось просмотреть расписание для следующих групп:', failedGroups);
        console.log('Всего расписаний:', schedules.length);
        console.log('Сохраняю в файл "./src/tests/data/subjectFields.json"...');
        
        const result = filterArrays(flattenObjectKeys(schedules.flat()));
        writeFileSync('./src/tests/data/subjectFields.json', JSON.stringify(result, null, 4));
        console.log('Файл сохранён');
    }, 1000 * groupNames.length + 2000);
}

main();