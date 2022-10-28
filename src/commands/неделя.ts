import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';

@ApplyOptions<Command.Options>({
	description: 'Показывает чётность недели и её номер'
})
export class UserCommand extends Command {
	// Регистрация аппликэйшен команды
	public override registerApplicationCommands(registry: Command.Registry) {

		// Регистрация слэш команды
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		});
	}

	// Слэш команда
	public async chatInputRun(interaction: Command.ChatInputInteraction) {

        const weekType = this.scheduleWeekType();

		await interaction.reply({
            content: `**Сейчас**\n> ${weekType.weekType} (${weekType.weekNumber} неделя)`,
            fetchReply: true
        });
	}

    // Чётность недели
    private scheduleWeekType(): any {
        let date = new Date(new Date().getTime());
        date.setHours(0, 0, 0, 0);
        // Четверг этой недели решает год.
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        // 4 Января - это всегда первая неделя
        let week1 = new Date(date.getFullYear(), 0, 4);
        let weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);

        return {
            weekNumber: weekNumber,
            weekType: weekNumber % 2 === 0 ? 'Чётная неделя' : 'Нечётная неделя'
        }
    }
}