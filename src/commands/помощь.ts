import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { capitalize } from '../lib/util';

@ApplyOptions<Command.Options>({
	description: 'Список команд и их применение'
})
export class UserCommand extends Command {
	// Регистрация аппликэйшен команды
	public override registerApplicationCommands(registry: Command.Registry) {


        // Получение всех команд для добавления их в варианты выбора
        const options = this.container.stores.get('commands').map((command) => {
            return {
                name: command.name,
                value: command.name
            }
        });

		// Регистрация слэш команды
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
            options: [
                {
                    name: 'команда',
                    description: 'Название команды для получения информации о ней',
                    type: 'STRING',
                    required: false,
                    choices: options
                }
            ]
		});
	}

	// Слэш команда
	public async chatInputRun(interaction: Command.ChatInputInteraction) {
        const commandName = interaction.options.getString('команда', false);

        if (commandName) {
            this.runWithCommand(interaction);
        } else {
            this.runWithoutCommand(interaction);
        }
	}

    public async runWithoutCommand(interaction: Command.ChatInputInteraction) {
        const commands = this.container.stores.get('commands');

        const formatted = commands.map((command) => `\`${command.name}\``).join(', ');

        const content = [
            ':robot: **Обо мне**:',
            '> Я бот, задачей которого является упрощение учёбы.',
            '> Я был написан на Node.js с использованием фреймворка Sapphire.',
            '> Мой открытый исходный код доступен на GitHub.',
            '> Больше обо мне можно узнать здесь: https://supersetkai.ru/projects/discord-bot',
            '',
            ':tools: **Список команд**:',
            `> ${formatted}`,
            '',
            ':sparkles: **Особенности**:',
            '> У меня есть база данных в случае если сайт КАИ упадёт.',
            '> Я могу работать в личных сообщениях.',
            '> Ты можешь добавить меня на свой сервер (посмотри в мой профиль).'
        ].join('\n');

        await interaction.reply({
            content: content,
            fetchReply: true
        });
    }

    public async runWithCommand(interaction: Command.ChatInputInteraction) {
        const { client } = this.container as any;

        const commandName: string = interaction.options.getString('команда', true);
        const command = this.container.stores.get('commands').get(commandName);

        // Убедиться в том, что команда существует
        if (!command) {
            await interaction.reply({
                content: ':no_entry_sign: Команда не найдена',
                fetchReply: true
            });
            return;
        }

        // Получаю все команды
        const commands = await client.api.applications(client.user.id).commands.get();

        // Фильтрую массив с командами, чтобы получить нужную команду
        const options = commands.find((element: any) => element.name === command.name).options;

        let formatted;

        // Добавляю выбор если он есть
        if (options) {
            formatted = options.map((option: any) => {
                const name = capitalize(option.name);
                const description = option.description;


                // Добавляю в строку варианты выбора если они есть
                if (option.choices) {
                    const choices = option.choices.map((choice: any) => {
                        return `\`${choice.name}\``;
                    }).join(', ');

                    return `> \`${name}\` - ${description}\n> Варианты: ${choices}`;
                }

                return `> \`${name}\` - ${description}`;
            });
        }

        const content = [
            `:information_source: **${capitalize(command.name)}**`,
            `> ${command.description}`,
            '',
            ':abcd: **Аргументы**',
            ...(formatted ? formatted : [ '> Нет аргументов' ])
        ].join('\n');

        await interaction.reply({
            content: content,
            fetchReply: true
        });
    }
}