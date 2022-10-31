import { PrismaClient } from '@prisma/client';
import type { ScheduleSpace } from '@supersetkai/kai.js';

export class Database {
    private static _instance: Database;
    private _client: PrismaClient;

    public constructor() {
        this._client = new PrismaClient();
    }

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    public get client() {
        return this._client;
    }

    public async saveSchedule(group: number, schedule: ScheduleSpace.Formatted): Promise<void> {
        const json = JSON.stringify(schedule);

        await this._client.schedule.upsert({
            where: { group },
            update: { data: json },
            create: { group, data: json }
        });
    }

    public async getSchedule(group: number): Promise<ScheduleSpace.Formatted> {
        const schedule = await this._client.schedule.findUnique({
            where: { group }
        });

        return JSON.parse(schedule?.data as string) as ScheduleSpace.Formatted || [];
    }
}