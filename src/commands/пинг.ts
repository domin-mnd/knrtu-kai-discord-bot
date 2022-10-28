import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { Message } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Пинг понг. Проверяет работоспособность бота, показывает задержку АПИ Дискорда & бота'
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

		const msg = await interaction.reply({ content: 'Пинг?', fetchReply: true });
		const createdTime = msg instanceof Message ? msg.createdTimestamp : Date.parse(msg.timestamp);

		const content = [
			'Понг!',
			`Задержка бота ${Math.round(this.container.client.ws.ping)}ms.`,
			`Задержка АПИ ${createdTime - interaction.createdTimestamp}ms.`
		].join('\n');

		return await interaction.editReply({
			content: content
		});
	}
}